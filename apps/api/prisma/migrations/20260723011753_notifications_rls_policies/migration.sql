-- RLS para notifications (RF-35 estendido). GRANT explícito porque o
-- GRANT ... ON ALL TABLES da migration rls_policies original não retroage.
-- NÃO há GRANT de INSERT de propósito: o único caminho de criação é a
-- função SECURITY DEFINER app_create_notification abaixo — em nenhum dos
-- ganchos a sessão é o destinatário (admin cria pra player, sender cria
-- pra recipient), então qualquer policy de INSERT direta seria ou inútil
-- (self-only) ou larga demais (qualquer autenticado forja pra terceiros).
GRANT SELECT ON notifications TO aet_hub_app;
-- UPDATE restrito por coluna: o app só pode mudar read_at (marcar lida) —
-- title/body/link_path/type/user_id ficam imutáveis declarativamente.
GRANT UPDATE (read_at) ON notifications TO aet_hub_app;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

-- Cada usuário só enxerga as próprias notificações. Sem policy de admin
-- de propósito: notificação é conteúdo pessoal, admin não precisa ler.
CREATE POLICY notifications_self_select ON notifications
  FOR SELECT TO aet_hub_app
  USING (
    current_setting('app.current_user_id', true) <> ''
    AND user_id = current_setting('app.current_user_id', true)
  );

-- Primeira policy de UPDATE self-only do projeto (precedentes eram
-- self-or-admin/admin-only). RLS não referencia OLD row — a garantia de
-- "só a coluna read_at muda" vem do GRANT por coluna acima, não daqui.
CREATE POLICY notifications_self_update ON notifications
  FOR UPDATE TO aet_hub_app
  USING (
    current_setting('app.current_user_id', true) <> ''
    AND user_id = current_setting('app.current_user_id', true)
  )
  WITH CHECK (
    current_setting('app.current_user_id', true) <> ''
    AND user_id = current_setting('app.current_user_id', true)
  );

-- DELETE nunca foi concedido; notifications é append-only + read_at.

-- Criação de notificação atravessando RLS: a sessão criadora NUNCA é o
-- destinatário. Mesma técnica de app_dm_recipient_display_name /
-- app_points_leaderboard (SECURITY DEFINER como fronteira estreita), mas
-- validando por tipo a linha "pai" que autoriza a operação — o espírito
-- da policy points_transactions_self_redemption_insert, movido para
-- dentro da função porque o EXISTS precisa enxergar linhas que a RLS da
-- sessão criadora não garante (e rodar como dono evita 42P17).
CREATE FUNCTION app_create_notification(
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
  session_user TEXT := current_setting('app.current_user_id', true);
  session_role TEXT := current_setting('app.current_role', true);
  is_authorized BOOLEAN := false;
  created_row notifications;
BEGIN
  IF session_user IS NULL OR session_user = '' THEN
    RAISE EXCEPTION 'app_create_notification: sessao nao autenticada';
  END IF;

  IF notif_type = 'DIRECT_MESSAGE' THEN
    -- Só o remetente real da DM notifica o destinatário real dela.
    is_authorized := EXISTS (
      SELECT 1 FROM direct_messages dm
      WHERE dm.id = parent_ref_id
        AND dm.recipient_id = recipient_user_id
        AND dm.sender_id = session_user
    );
  ELSIF notif_type = 'MATCH_READY' THEN
    is_authorized := session_role = 'ADMIN' AND EXISTS (
      SELECT 1 FROM matches m
      JOIN registrations r
        ON r.id = m.registration_a_id OR r.id = m.registration_b_id
      WHERE m.id = parent_ref_id
        AND r.user_id = recipient_user_id
    );
  ELSIF notif_type = 'REDEMPTION_UPDATED' THEN
    is_authorized := session_role = 'ADMIN' AND EXISTS (
      SELECT 1 FROM redemptions rd
      WHERE rd.id = parent_ref_id
        AND rd.user_id = recipient_user_id
    );
  ELSIF notif_type = 'TOURNAMENT_COMPLETED' THEN
    is_authorized := session_role = 'ADMIN' AND EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.tournament_id = parent_ref_id
        AND r.user_id = recipient_user_id
    );
  END IF;

  IF NOT is_authorized THEN
    RAISE EXCEPTION 'app_create_notification: operacao nao autorizada';
  END IF;

  -- gen_random_uuid: o default cuid() do Prisma é client-side e nenhum
  -- código cria Notification via Prisma Client — id uuid-texto é aceito.
  INSERT INTO notifications (id, user_id, type, title, body, link_path, ref_id)
  VALUES (
    gen_random_uuid()::text, recipient_user_id, notif_type,
    notif_title, notif_body, notif_link_path, parent_ref_id
  )
  RETURNING * INTO created_row;

  RETURN created_row;
END;
$$;

REVOKE ALL ON FUNCTION app_create_notification(TEXT, "NotificationType", TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_create_notification(TEXT, "NotificationType", TEXT, TEXT, TEXT, TEXT) TO aet_hub_app;
