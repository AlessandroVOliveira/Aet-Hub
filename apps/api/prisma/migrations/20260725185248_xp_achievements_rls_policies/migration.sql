-- RLS para achievements/user_achievements/xp_transactions (RF-29). Ordem
-- obrigatória por tabela (lição da Fatia 13, repetida em toda tabela nova
-- desde então): REVOKE dos default privileges PRIMEIRO (ALTER DEFAULT
-- PRIVILEGES de roles.sql concede SELECT/INSERT/UPDATE/DELETE a toda
-- tabela nova) e só então GRANT estreito.
--
-- As três tabelas são catalog-style totalmente abertas em SELECT (mesmo
-- padrão de games/store_items/communities) — decisão de produto desta
-- fatia: nível/XP/conquistas são exibidos no perfil público de qualquer
-- player, não só o próprio. Escrita em user_achievements/xp_transactions
-- é sempre admin-only porque as duas só são geradas dentro da transação
-- de completeTournament (tournaments.service.ts), cujo actor é sempre
-- ADMIN — mesma forma de points_transactions_admin_insert, sem precisar
-- de função SECURITY DEFINER pra essas escritas (diferente de
-- follows/DM, onde o actor é um player comum).

-- ---------------------------------------------------------------------
-- achievements: catálogo de escrita admin. Sem DELETE de propósito —
-- conquista se desativa (isActive), nunca se apaga (mesmo padrão de
-- games/store_items/communities). `code` é imutável após criação
-- (garantido na camada de aplicação, não na RLS).
-- ---------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON achievements FROM aet_hub_app;
GRANT SELECT, INSERT, UPDATE ON achievements TO aet_hub_app;

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements FORCE ROW LEVEL SECURITY;

CREATE POLICY achievements_authenticated_select ON achievements
  FOR SELECT TO aet_hub_app
  USING (current_setting('app.current_user_id', true) <> '');

CREATE POLICY achievements_admin_insert ON achievements
  FOR INSERT TO aet_hub_app
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

CREATE POLICY achievements_admin_update ON achievements
  FOR UPDATE TO aet_hub_app
  USING (current_setting('app.current_role', true) = 'ADMIN')
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

-- ---------------------------------------------------------------------
-- user_achievements: eventos de desbloqueio, imutáveis (sem UPDATE/DELETE
-- em lugar nenhum). Leitura aberta pro perfil público; escrita só admin,
-- sempre dentro de completeTournament.
-- ---------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON user_achievements FROM aet_hub_app;
GRANT SELECT, INSERT ON user_achievements TO aet_hub_app;

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements FORCE ROW LEVEL SECURITY;

CREATE POLICY user_achievements_authenticated_select ON user_achievements
  FOR SELECT TO aet_hub_app
  USING (current_setting('app.current_user_id', true) <> '');

CREATE POLICY user_achievements_admin_insert ON user_achievements
  FOR INSERT TO aet_hub_app
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

-- ---------------------------------------------------------------------
-- xp_transactions: mesmo desenho de points_transactions — ledger
-- append-only, leitura aberta (perfil público mostra XP de qualquer
-- player), escrita só admin (sempre dentro de completeTournament).
-- ---------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON xp_transactions FROM aet_hub_app;
GRANT SELECT, INSERT ON xp_transactions TO aet_hub_app;

ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions FORCE ROW LEVEL SECURITY;

CREATE POLICY xp_transactions_authenticated_select ON xp_transactions
  FOR SELECT TO aet_hub_app
  USING (current_setting('app.current_user_id', true) <> '');

CREATE POLICY xp_transactions_admin_insert ON xp_transactions
  FOR INSERT TO aet_hub_app
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

-- ---------------------------------------------------------------------
-- app_create_notification: estende os tipos ACHIEVEMENT_UNLOCKED e
-- LEVEL_UP sobre o corpo vigente da função (migration
-- follows_rls_policies). CREATE OR REPLACE preserva os privilégios já
-- concedidos (REVOKE ALL FROM PUBLIC + GRANT EXECUTE TO aet_hub_app) —
-- não repetir aqui. Seguro usar os valores novos do enum aqui porque
-- foram commitados na migration anterior (add_xp_achievements).
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
  ELSIF notif_type = 'FOLLOWED' THEN
    -- Só o follower real (parent_ref_id = a linha follows) notifica quem
    -- ele realmente passou a seguir.
    is_authorized := EXISTS (
      SELECT 1 FROM follows f
      WHERE f.id = parent_ref_id
        AND f.follower_id = acting_user_id
        AND f.following_id = recipient_user_id
    );
  ELSIF notif_type = 'ACHIEVEMENT_UNLOCKED' THEN
    -- Só ADMIN (actor de completeTournament) notifica o próprio dono do
    -- desbloqueio (parent_ref_id = a linha user_achievements criada).
    is_authorized := acting_role = 'ADMIN' AND EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.id = parent_ref_id
        AND ua.user_id = recipient_user_id
    );
  ELSIF notif_type = 'LEVEL_UP' THEN
    -- Level-up é detectado dentro de completeTournament — mesmo
    -- predicado de TOURNAMENT_COMPLETED (parent_ref_id = id do torneio).
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
