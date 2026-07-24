-- RLS para reports (RF-40, Fatia A). REVOKE dos default privileges PRIMEIRO,
-- GRANT estreito depois (lição da Fatia 13 — ALTER DEFAULT PRIVILEGES de
-- roles.sql dá arwd automático pra aet_hub_app em toda tabela nova; sem o
-- REVOKE, a tabela fica com privilégio pleno por baixo mesmo com as
-- policies certas em cima).
REVOKE INSERT, UPDATE, DELETE ON reports FROM aet_hub_app;
GRANT SELECT, INSERT, UPDATE ON reports TO aet_hub_app;

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports FORCE ROW LEVEL SECURITY;

-- Reporter vê as próprias denúncias, admin vê todas. Self-select é
-- obrigatório mesmo sem tela "minhas denúncias" nesta fatia: todo INSERT do
-- Prisma emite RETURNING, e sem essa policy a própria sessão do reporter não
-- conseguiria ler de volta a linha recém-inserida. Mesmo padrão de
-- points_transactions_self_or_admin_select.
CREATE POLICY reports_self_or_admin_select ON reports
  FOR SELECT TO aet_hub_app
  USING (
    reporter_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  );

-- Cada usuário só denuncia como ele mesmo. Autorização de QUAL conteúdo pode
-- ser denunciado (existe? o reporter pode vê-lo? não é o próprio autor?) é
-- responsabilidade do service (reports.service.ts), que busca o conteúdo
-- original sob a sessão RLS do próprio reporter antes do INSERT — não dá
-- pra expressar isso aqui porque content_id é polimórfico (aponta pra 5
-- tabelas diferentes conforme content_type, sem FK possível).
CREATE POLICY reports_self_insert ON reports
  FOR INSERT TO aet_hub_app
  WITH CHECK (
    reporter_id = current_setting('app.current_user_id', true)
    AND current_setting('app.current_user_id', true) <> ''
  );

-- Só admin resolve (dispensa) uma denúncia nesta fatia. Sem restrição de
-- coluna (diferente do read_at de notifications): toda UPDATE por ADMIN é
-- dismiss, o service monta o SET inteiro (status/reviewed_at/
-- reviewed_by_user_id) numa tacada só, mesmo padrão de admin update de
-- store_items/communities.
CREATE POLICY reports_admin_update ON reports
  FOR UPDATE TO aet_hub_app
  USING (current_setting('app.current_role', true) = 'ADMIN')
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

-- Sem policy de DELETE (bloqueado por padrão, e DELETE já não foi
-- re-concedido acima) — denúncia é registro permanente, nunca some.
