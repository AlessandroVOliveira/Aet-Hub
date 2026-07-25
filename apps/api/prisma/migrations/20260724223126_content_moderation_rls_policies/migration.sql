-- RF-25 (Fatia B): admin remove conteúdo denunciado a partir da fila de
-- denúncias. posts/comments/news_comments já concedem DELETE a aet_hub_app
-- desde as migrations que criaram cada tabela (self-only) — só falta a
-- policy admin, aditiva (RLS combina policies do mesmo comando via OR, sem
-- tocar na *_self_delete existente).
CREATE POLICY posts_admin_delete ON posts
  FOR DELETE TO aet_hub_app
  USING (current_setting('app.current_role', true) = 'ADMIN');

CREATE POLICY comments_admin_delete ON comments
  FOR DELETE TO aet_hub_app
  USING (current_setting('app.current_role', true) = 'ADMIN');

CREATE POLICY news_comments_admin_delete ON news_comments
  FOR DELETE TO aet_hub_app
  USING (current_setting('app.current_role', true) = 'ADMIN');

-- chat_messages/direct_messages: DELETE foi explicitamente revogado nas
-- migrations que as criaram ("imutável nesta fatia — moderação fará sua
-- própria migration", ver chat_messages_rls_policies/
-- direct_messages_rls_policies) — precisa GRANT antes da policy.
GRANT DELETE ON chat_messages TO aet_hub_app;
CREATE POLICY chat_messages_admin_delete ON chat_messages
  FOR DELETE TO aet_hub_app
  USING (current_setting('app.current_role', true) = 'ADMIN');

GRANT DELETE ON direct_messages TO aet_hub_app;
CREATE POLICY direct_messages_admin_delete ON direct_messages
  FOR DELETE TO aet_hub_app
  USING (current_setting('app.current_role', true) = 'ADMIN');
