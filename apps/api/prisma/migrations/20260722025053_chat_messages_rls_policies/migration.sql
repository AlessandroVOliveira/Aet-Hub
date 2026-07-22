-- RLS para chat_messages (RF-37). GRANT explícito porque o `GRANT ... ON
-- ALL TABLES IN SCHEMA public` da migration `rls_policies` original não
-- retroage para tabelas criadas em migration posterior (ver CLAUDE.md).
GRANT SELECT, INSERT ON chat_messages TO aet_hub_app;

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages FORCE ROW LEVEL SECURITY;

-- Leitura para qualquer sessão AUTENTICADA (canal único visível a todos
-- os players logados), mas não para sessão anônima — primeiro uso do
-- predicado `current_setting(...) <> ''`, mais estreito que o USING (true)
-- de tournament_photos porque mensagem de chat é conteúdo de usuário.
-- Se a variável nem foi setada, current_setting(..., true) retorna NULL e
-- NULL <> '' também nega a linha.
CREATE POLICY chat_messages_authenticated_select ON chat_messages
  FOR SELECT TO aet_hub_app
  USING (current_setting('app.current_user_id', true) <> '');

-- Cada usuário só insere mensagem como ele mesmo.
CREATE POLICY chat_messages_self_insert ON chat_messages
  FOR INSERT TO aet_hub_app
  WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
    AND current_setting('app.current_user_id', true) <> ''
  );

-- Imutável nesta fatia — moderação (RF-25) fará sua própria migration.
-- Mesma dupla camada de points_transactions/tournament_photos.
REVOKE UPDATE, DELETE ON chat_messages FROM aet_hub_app;
