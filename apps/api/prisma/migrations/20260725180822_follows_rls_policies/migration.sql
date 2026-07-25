-- RLS para follows (RF-41). GRANT explícito porque o GRANT ... ON ALL
-- TABLES da migration rls_policies original não retroage para tabelas
-- novas. Sem UPDATE de propósito — a relação é binária (existe/não
-- existe), mesmo padrão de post_likes.
REVOKE INSERT, UPDATE, DELETE ON follows FROM aet_hub_app;
GRANT SELECT, INSERT, DELETE ON follows TO aet_hub_app;

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows FORCE ROW LEVEL SECURITY;

-- Cobre as duas listas (quem eu sigo / quem me segue) numa policy só —
-- cada linha só interessa às duas partes que ela referencia.
CREATE POLICY follows_self_select ON follows
  FOR SELECT TO aet_hub_app
  USING (
    current_setting('app.current_user_id', true) <> ''
    AND (
      follower_id = current_setting('app.current_user_id', true)
      OR following_id = current_setting('app.current_user_id', true)
    )
  );

-- Só insere como si mesmo e nunca para si mesmo.
CREATE POLICY follows_self_insert ON follows
  FOR INSERT TO aet_hub_app
  WITH CHECK (
    current_setting('app.current_user_id', true) <> ''
    AND follower_id = current_setting('app.current_user_id', true)
    AND following_id <> follower_id
  );

-- Só quem seguiu desfaz o próprio follow.
CREATE POLICY follows_self_delete ON follows
  FOR DELETE TO aet_hub_app
  USING (follower_id = current_setting('app.current_user_id', true));

-- app_create_notification: estende o tipo FOLLOWED sobre o corpo vigente
-- da função (migration communities_rls_policies). CREATE OR REPLACE
-- preserva os privilégios já concedidos (REVOKE ALL FROM PUBLIC + GRANT
-- EXECUTE TO aet_hub_app) — não repetir aqui.
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
  ELSIF notif_type = 'POST_COMMENT' THEN
    -- Só o autor real do comentário (parent_ref_id) notifica o autor do
    -- post comentado — e nunca a si mesmo (o service nem chama a função
    -- em self-comment; este predicado é a garantia por baixo).
    is_authorized := EXISTS (
      SELECT 1 FROM comments c
      JOIN posts p ON p.id = c.post_id
      WHERE c.id = parent_ref_id
        AND c.user_id = acting_user_id
        AND p.user_id = recipient_user_id
        AND p.user_id <> c.user_id
    );
  ELSIF notif_type = 'FOLLOWED' THEN
    -- Só o follower real (parent_ref_id = a linha follows) notifica quem
    -- ele realmente passou a seguir.
    is_authorized := EXISTS (
      SELECT 1 FROM follows f
      WHERE f.id = parent_ref_id
        AND f.follower_id = acting_user_id
        AND f.following_id = recipient_user_id
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
