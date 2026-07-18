-- RLS para tournament_photos (RF-15). GRANT explícito porque o `GRANT ...
-- ON ALL TABLES IN SCHEMA public` da migration `rls_policies` original só
-- valeu para as tabelas que já existiam naquele momento — não retroage
-- para uma tabela criada numa migration posterior (mesmo raciocínio do
-- ALTER DEFAULT PRIVILEGES documentado no CLAUDE.md).
GRANT SELECT, INSERT ON tournament_photos TO aet_hub_app;

ALTER TABLE tournament_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_photos FORCE ROW LEVEL SECURITY;

-- Leitura para qualquer autenticado (RF-15 — "disponíveis para download
-- pelos players"), não só o dono/admin como em registrations/checkins.
CREATE POLICY tournament_photos_public_select ON tournament_photos
  FOR SELECT TO aet_hub_app
  USING (true);

-- Escrita só admin — e só depois do torneio encerrado, mas essa segunda
-- regra depende do status do Tournament associado (não de uma coluna
-- própria da linha), então é validada em tournament-photos.service.ts,
-- não aqui.
CREATE POLICY tournament_photos_admin_insert ON tournament_photos
  FOR INSERT TO aet_hub_app
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

-- Sem endpoint de edição/exclusão nesta fatia — mesma dupla camada de
-- imutabilidade usada em points_transactions/audit_logs.
REVOKE UPDATE, DELETE ON tournament_photos FROM aet_hub_app;
