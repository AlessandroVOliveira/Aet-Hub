-- Corrige bug encontrado na verificação fim a fim da Fatia 13:
-- `session_user` é uma palavra reservada do padrão SQL (pseudo-constante
-- que devolve a ROLE de conexão, ex. 'aet_hub_app') — declarar uma
-- variável plpgsql com esse nome NÃO sobrescreve o significado dela
-- dentro de expressões SQL embutidas (os `WHERE dm.sender_id =
-- session_user` etc. abaixo resolviam sempre para 'aet_hub_app', nunca
-- para o id do usuário da sessão), então toda checagem de autorização
-- falhava e app_create_notification sempre lançava "operacao nao
-- autorizada" mesmo pra chamadas legítimas. Renomeada para
-- acting_user_id (mesmo padrão de nome de parâmetro sem colisão já usado
-- em recipient_user_id/target_user_id). Comportamento da função
-- (validação por tipo, RAISE EXCEPTION se não autorizado) inalterado.
CREATE OR REPLACE FUNCTION app_create_notification(
  recipient_user_id TEXT,
  notif_type "NotificationType",
  notif_title TEXT,
  notif_body TEXT,
  notif_link_path TEXT,
  parent_ref_id TEXT
) RETURNS notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acting_user_id TEXT := current_setting('app.current_user_id', true);
  acting_role TEXT := current_setting('app.current_role', true);
  is_authorized BOOLEAN := false;
  created_row notifications;
BEGIN
  IF acting_user_id IS NULL OR acting_user_id = '' THEN
    RAISE EXCEPTION 'app_create_notification: sessao nao autenticada';
  END IF;

  IF notif_type = 'DIRECT_MESSAGE' THEN
    -- Só o remetente real da DM notifica o destinatário real dela.
    is_authorized := EXISTS (
      SELECT 1 FROM direct_messages dm
      WHERE dm.id = parent_ref_id
        AND dm.recipient_id = recipient_user_id
        AND dm.sender_id = acting_user_id
    );
  ELSIF notif_type = 'MATCH_READY' THEN
    is_authorized := acting_role = 'ADMIN' AND EXISTS (
      SELECT 1 FROM matches m
      JOIN registrations r
        ON r.id = m.registration_a_id OR r.id = m.registration_b_id
      WHERE m.id = parent_ref_id
        AND r.user_id = recipient_user_id
    );
  ELSIF notif_type = 'REDEMPTION_UPDATED' THEN
    is_authorized := acting_role = 'ADMIN' AND EXISTS (
      SELECT 1 FROM redemptions rd
      WHERE rd.id = parent_ref_id
        AND rd.user_id = recipient_user_id
    );
  ELSIF notif_type = 'TOURNAMENT_COMPLETED' THEN
    is_authorized := acting_role = 'ADMIN' AND EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.tournament_id = parent_ref_id
        AND r.user_id = recipient_user_id
    );
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'app_create_notification: operacao nao autorizada';
  END IF;

  INSERT INTO notifications (id, user_id, type, title, body, link_path, ref_id)
  VALUES (
    gen_random_uuid()::text, recipient_user_id, notif_type,
    notif_title, notif_body, notif_link_path, parent_ref_id
  )
  RETURNING * INTO created_row;

  RETURN created_row;
END;
$$;
