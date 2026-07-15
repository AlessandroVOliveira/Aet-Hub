-- Row Level Security (RLS) — requisito não-negociável do produto (ver
-- CLAUDE.md e RF-01/RNF-01 em docs/PRD.md).
--
-- As policies abaixo leem duas variáveis de sessão, setadas por request via
-- apps/api/src/config/rls.ts (`withRls`): app.current_user_id e
-- app.current_role ('PLAYER' | 'ADMIN' | 'anonymous').
--
-- Duas roles de runtime (criadas em prisma/roles.sql, antes desta
-- migration rodar):
--   - aet_hub_app: role autenticada normal, RLS baseada nas variáveis acima.
--   - aet_hub_auth: role estritamente escopada para login/cadastro (só
--     tabelas users/profiles/addresses, só as operações que o fluxo de
--     auth precisa) — nunca usada fora de modules/auth.

-- roles.sql configura ALTER DEFAULT PRIVILEGES para aet_hub_app, mas isso
-- só vale para tabelas criadas DEPOIS daquele comando — não retroage para
-- as tabelas que a migration `init` acabou de criar. Por isso o GRANT
-- explícito abaixo: garante que aet_hub_app tem privilégio de tabela
-- independente da ordem entre `db:roles` e as migrations (importante em
-- especial após `prisma migrate reset`, que recria as tabelas do zero).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aet_hub_app;

-- =============================================================
-- users
-- =============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

CREATE POLICY users_self_or_admin_select ON users
  FOR SELECT TO aet_hub_app
  USING (
    id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  );

CREATE POLICY users_self_or_admin_update ON users
  FOR UPDATE TO aet_hub_app
  USING (
    id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  )
  WITH CHECK (
    id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  );

-- Exceção estritamente escopada para o fluxo de auth (login/cadastro):
-- resolve o "chicken-and-egg" de RLS quando ainda não existe usuário
-- autenticado. A restrição real vem de ser uma role de Postgres à parte
-- (TO aet_hub_auth), não de uma variável de sessão.
CREATE POLICY users_auth_lookup_select ON users
  FOR SELECT TO aet_hub_auth
  USING (true);

CREATE POLICY users_auth_register_insert ON users
  FOR INSERT TO aet_hub_auth
  WITH CHECK (role = 'PLAYER'); -- impede escalonamento de privilégio via auto-cadastro

GRANT SELECT, INSERT ON users TO aet_hub_auth;

-- =============================================================
-- profiles / addresses (1:1 com users)
-- =============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY profiles_self_or_admin_select ON profiles
  FOR SELECT TO aet_hub_app
  USING (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  );

CREATE POLICY profiles_self_or_admin_update ON profiles
  FOR UPDATE TO aet_hub_app
  USING (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  )
  WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  );

-- Criação de perfil acontece dentro do cadastro (role aet_hub_auth),
-- nunca via aet_hub_app. SELECT também é necessário aqui: o Prisma emite
-- INSERT ... RETURNING nos nested writes, e sob RLS o RETURNING é avaliado
-- como uma leitura da linha — sem privilégio de SELECT, o Postgres nega
-- com "permission denied" antes mesmo de chegar a avaliar a policy.
GRANT SELECT, INSERT ON profiles TO aet_hub_auth;

CREATE POLICY profiles_auth_insert ON profiles
  FOR INSERT TO aet_hub_auth
  WITH CHECK (true);

CREATE POLICY profiles_auth_select ON profiles
  FOR SELECT TO aet_hub_auth
  USING (true);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses FORCE ROW LEVEL SECURITY;

CREATE POLICY addresses_self_or_admin_select ON addresses
  FOR SELECT TO aet_hub_app
  USING (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  );

CREATE POLICY addresses_self_or_admin_update ON addresses
  FOR UPDATE TO aet_hub_app
  USING (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  )
  WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  );

GRANT SELECT, INSERT ON addresses TO aet_hub_auth;

CREATE POLICY addresses_auth_insert ON addresses
  FOR INSERT TO aet_hub_auth
  WITH CHECK (true);

CREATE POLICY addresses_auth_select ON addresses
  FOR SELECT TO aet_hub_auth
  USING (true);

-- =============================================================
-- registrations / checkins
-- =============================================================
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations FORCE ROW LEVEL SECURITY;

-- NOTA: por ora, "dono" de uma inscrição é só o próprio player ou um
-- admin. Quando o bloco de chaveamento for implementado, provavelmente
-- vai ser preciso liberar leitura parcial (ex: nome do adversário) para
-- outros players do mesmo torneio — reavaliar esta policy naquele bloco.
CREATE POLICY registrations_self_or_admin_select ON registrations
  FOR SELECT TO aet_hub_app
  USING (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  );

CREATE POLICY registrations_self_or_admin_insert ON registrations
  FOR INSERT TO aet_hub_app
  WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  );

CREATE POLICY registrations_self_or_admin_update ON registrations
  FOR UPDATE TO aet_hub_app
  USING (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  )
  WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  );

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins FORCE ROW LEVEL SECURITY;

-- checkins não tem user_id direto: o dono é o usuário da registration
-- associada, daí a subquery.
CREATE POLICY checkins_self_or_admin_select ON checkins
  FOR SELECT TO aet_hub_app
  USING (
    current_setting('app.current_role', true) = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = checkins.registration_id
        AND r.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY checkins_admin_insert ON checkins
  FOR INSERT TO aet_hub_app
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

-- =============================================================
-- points_transactions (ledger imutável — RNF-08)
-- =============================================================
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions FORCE ROW LEVEL SECURITY;

CREATE POLICY points_transactions_self_or_admin_select ON points_transactions
  FOR SELECT TO aet_hub_app
  USING (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  );

CREATE POLICY points_transactions_admin_insert ON points_transactions
  FOR INSERT TO aet_hub_app
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

-- Sem policy de UPDATE/DELETE (bloqueado por padrão) + privilégio
-- revogado abaixo: duas camadas independentes de imutabilidade.
REVOKE UPDATE, DELETE ON points_transactions FROM aet_hub_app;

-- =============================================================
-- redemptions
-- =============================================================
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions FORCE ROW LEVEL SECURITY;

CREATE POLICY redemptions_self_or_admin_select ON redemptions
  FOR SELECT TO aet_hub_app
  USING (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  );

CREATE POLICY redemptions_self_or_admin_insert ON redemptions
  FOR INSERT TO aet_hub_app
  WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  );

CREATE POLICY redemptions_admin_update ON redemptions
  FOR UPDATE TO aet_hub_app
  USING (current_setting('app.current_role', true) = 'ADMIN')
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

-- =============================================================
-- audit_logs (RF-06, imutável, admin-only)
-- =============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_admin_select ON audit_logs
  FOR SELECT TO aet_hub_app
  USING (current_setting('app.current_role', true) = 'ADMIN');

CREATE POLICY audit_logs_admin_insert ON audit_logs
  FOR INSERT TO aet_hub_app
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

REVOKE UPDATE, DELETE ON audit_logs FROM aet_hub_app;

-- =============================================================
-- Tabelas não específicas de usuário: RLS como defesa extra (não é
-- requisito obrigatório do CLAUDE.md, mas reforça caso uma rota futura
-- esqueça requireRole('ADMIN')). Leitura pública, escrita admin-only.
-- =============================================================
DO $$
DECLARE
  public_read_table TEXT;
BEGIN
  FOREACH public_read_table IN ARRAY ARRAY[
    'games', 'tournaments', 'tournament_placement_rewards', 'sponsors',
    'bracket_slots', 'matches', 'store_items'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', public_read_table);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', public_read_table);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO aet_hub_app USING (true)',
      public_read_table || '_public_select', public_read_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT TO aet_hub_app WITH CHECK (current_setting(''app.current_role'', true) = ''ADMIN'')',
      public_read_table || '_admin_insert', public_read_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE TO aet_hub_app USING (current_setting(''app.current_role'', true) = ''ADMIN'') WITH CHECK (current_setting(''app.current_role'', true) = ''ADMIN'')',
      public_read_table || '_admin_update', public_read_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE TO aet_hub_app USING (current_setting(''app.current_role'', true) = ''ADMIN'')',
      public_read_table || '_admin_delete', public_read_table
    );
  END LOOP;
END
$$;
