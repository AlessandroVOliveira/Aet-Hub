-- RLS para news_items/news_comments (RF-36). Mesma ordem obrigatória por
-- tabela: REVOKE dos default privileges PRIMEIRO (ALTER DEFAULT PRIVILEGES
-- de roles.sql concede SELECT/INSERT/UPDATE/DELETE a toda tabela nova) e
-- só então GRANT estreito (ver notifications_revoke_default_privileges).

-- ---------------------------------------------------------------------
-- news_items: cache alimentado pelo refresh-se-obsoleto (feed.service.ts),
-- disparado pela leitura de QUALQUER sessão autenticada, não só admin —
-- diferente do padrão de communities. O corpo do INSERT nunca é texto
-- livre de usuário (é sempre o resultado mapeado de
-- feed.apitube-client.ts) e a linha não carrega identidade de quem
-- disparou o refresh (sem user_id nesta tabela) — restringir a
-- role='ADMIN' quebraria o refresh pra praticamente toda requisição real
-- sem ganho de segurança. Sem UPDATE/DELETE: conteúdo de notícia
-- publicada não muda (insert-only, dedup via unique [category,
-- external_id]) e não há exclusão nesta fatia.
-- ---------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON news_items FROM aet_hub_app;
GRANT SELECT, INSERT ON news_items TO aet_hub_app;

ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items FORCE ROW LEVEL SECURITY;

CREATE POLICY news_items_authenticated_select ON news_items
  FOR SELECT TO aet_hub_app
  USING (current_setting('app.current_user_id', true) <> '');

CREATE POLICY news_items_authenticated_insert ON news_items
  FOR INSERT TO aet_hub_app
  WITH CHECK (current_setting('app.current_user_id', true) <> '');

-- ---------------------------------------------------------------------
-- news_comments: mesmo desenho self-only de comments (RF-39) — sem
-- UPDATE de propósito (edição fora de escopo).
-- ---------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON news_comments FROM aet_hub_app;
GRANT SELECT, INSERT, DELETE ON news_comments TO aet_hub_app;

ALTER TABLE news_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_comments FORCE ROW LEVEL SECURITY;

CREATE POLICY news_comments_authenticated_select ON news_comments
  FOR SELECT TO aet_hub_app
  USING (current_setting('app.current_user_id', true) <> '');

CREATE POLICY news_comments_self_insert ON news_comments
  FOR INSERT TO aet_hub_app
  WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
    AND current_setting('app.current_user_id', true) <> ''
  );

CREATE POLICY news_comments_self_delete ON news_comments
  FOR DELETE TO aet_hub_app
  USING (user_id = current_setting('app.current_user_id', true));
