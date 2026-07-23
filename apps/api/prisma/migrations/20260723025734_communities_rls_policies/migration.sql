-- RLS para communities/posts/comments/post_likes (RF-23 + RF-39). Ordem
-- obrigatória por tabela (lição da Fatia 13): REVOKE dos default privileges
-- PRIMEIRO (ALTER DEFAULT PRIVILEGES de roles.sql concede SELECT/INSERT/
-- UPDATE/DELETE a toda tabela nova) e só então GRANT estreito — senão a
-- tabela fica com privilégio pleno por baixo mesmo com as policies certas
-- (ver notifications_revoke_default_privileges).

-- ---------------------------------------------------------------------
-- communities: catálogo de escrita admin. Sem DELETE de propósito —
-- comunidade se desativa (isActive), nunca se apaga (mesmo padrão de
-- store_items).
-- ---------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON communities FROM aet_hub_app;
GRANT SELECT, INSERT, UPDATE ON communities TO aet_hub_app;

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities FORCE ROW LEVEL SECURITY;

-- Leitura para qualquer sessão autenticada (mesmo padrão de chat_messages):
-- comunidade inativa também precisa ser lida pela sessão ADMIN (tela de
-- gestão lista todas) — o filtro "só ativa" pra player é feito no service,
-- não na policy, porque a policy não distingue role aqui.
CREATE POLICY communities_authenticated_select ON communities
  FOR SELECT TO aet_hub_app
  USING (current_setting('app.current_user_id', true) <> '');

CREATE POLICY communities_admin_insert ON communities
  FOR INSERT TO aet_hub_app
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

CREATE POLICY communities_admin_update ON communities
  FOR UPDATE TO aet_hub_app
  USING (current_setting('app.current_role', true) = 'ADMIN')
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

-- ---------------------------------------------------------------------
-- posts: sem UPDATE de propósito (edição fora de escopo desta fatia).
-- ---------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON posts FROM aet_hub_app;
GRANT SELECT, INSERT, DELETE ON posts TO aet_hub_app;

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts FORCE ROW LEVEL SECURITY;

CREATE POLICY posts_authenticated_select ON posts
  FOR SELECT TO aet_hub_app
  USING (current_setting('app.current_user_id', true) <> '');

-- Cada usuário só posta como ele mesmo; author_display_name é livre no
-- INSERT (mesmo padrão de chat_messages — é o service, não a RLS, que
-- garante que o valor vem do Profile do autor).
CREATE POLICY posts_self_insert ON posts
  FOR INSERT TO aet_hub_app
  WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
    AND current_setting('app.current_user_id', true) <> ''
  );

-- Primeira policy de DELETE self-only do projeto. O ON DELETE CASCADE de
-- comments/post_likes é referential action do Postgres e NÃO passa pela
-- RLS dessas tabelas — excluir o próprio post apaga comentários/curtidas
-- DE OUTROS usuários junto, intencional (dono do post decide se o post
-- existe, não quem comentou nele).
CREATE POLICY posts_self_delete ON posts
  FOR DELETE TO aet_hub_app
  USING (user_id = current_setting('app.current_user_id', true));

-- ---------------------------------------------------------------------
-- comments: mesmo desenho de posts.
-- ---------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON comments FROM aet_hub_app;
GRANT SELECT, INSERT, DELETE ON comments TO aet_hub_app;

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments FORCE ROW LEVEL SECURITY;

CREATE POLICY comments_authenticated_select ON comments
  FOR SELECT TO aet_hub_app
  USING (current_setting('app.current_user_id', true) <> '');

CREATE POLICY comments_self_insert ON comments
  FOR INSERT TO aet_hub_app
  WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
    AND current_setting('app.current_user_id', true) <> ''
  );

CREATE POLICY comments_self_delete ON comments
  FOR DELETE TO aet_hub_app
  USING (user_id = current_setting('app.current_user_id', true));

-- ---------------------------------------------------------------------
-- post_likes: SELECT autenticado (contagem/likedByMe precisam enxergar
-- curtidas de todo mundo, não só as próprias).
-- ---------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON post_likes FROM aet_hub_app;
GRANT SELECT, INSERT, DELETE ON post_likes TO aet_hub_app;

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes FORCE ROW LEVEL SECURITY;

CREATE POLICY post_likes_authenticated_select ON post_likes
  FOR SELECT TO aet_hub_app
  USING (current_setting('app.current_user_id', true) <> '');

CREATE POLICY post_likes_self_insert ON post_likes
  FOR INSERT TO aet_hub_app
  WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
    AND current_setting('app.current_user_id', true) <> ''
  );

CREATE POLICY post_likes_self_delete ON post_likes
  FOR DELETE TO aet_hub_app
  USING (user_id = current_setting('app.current_user_id', true));

-- ---------------------------------------------------------------------
-- app_create_notification: estende o tipo POST_COMMENT sobre o corpo
-- vigente da função (migration fix_notification_session_user_shadow).
-- CREATE OR REPLACE preserva os privilégios já concedidos (REVOKE ALL FROM
-- PUBLIC + GRANT EXECUTE TO aet_hub_app) — não repetir aqui.
-- ---------------------------------------------------------------------
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
