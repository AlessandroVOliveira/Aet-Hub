-- Bug de RLS descoberto testando content_moderation_rls_policies fim a fim:
-- DELETE FROM direct_messages ... WHERE id=... afetava 0 linhas mesmo com a
-- policy direct_messages_admin_delete (role=ADMIN) e o GRANT DELETE
-- corretos. Causa raiz: pra DELETE/UPDATE, o Postgres precisa que a linha
-- também seja visível pela policy de SELECT da tabela (é o SELECT que
-- alimenta o scan que localiza as linhas candidatas ao DELETE) — não basta
-- só a policy do próprio comando. chat_messages_admin_delete "funcionava
-- por acidente" porque chat_messages_authenticated_select já é "qualquer
-- sessão autenticada" (current_user_id <> ''), o que sempre é verdade pra
-- sessão do admin; direct_messages_participant_select exige sender_id OU
-- recipient_id = sessão, e o admin normalmente não é participante da
-- conversa que está moderando. Fix: policy de SELECT aditiva pra admin
-- (combina via OR com a de participante existente), mesmo padrão de
-- posts_admin_delete/comments_admin_delete/news_comments_admin_delete
-- terem funcionado de primeira só porque as SELECT policies dessas tabelas
-- já eram "qualquer autenticado".
CREATE POLICY direct_messages_admin_select ON direct_messages
  FOR SELECT TO aet_hub_app
  USING (current_setting('app.current_role', true) = 'ADMIN');