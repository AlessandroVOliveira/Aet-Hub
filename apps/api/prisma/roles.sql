-- Provisiona as roles de runtime do banco (rodar uma vez por ambiente).
-- NÃO faz parte do fluxo de `prisma migrate` porque roles são objetos de
-- cluster, não de schema, e o Prisma Migrate não teria como gerenciá-las
-- de forma idempotente. Rodar via:
--
--   npm run db:roles --workspace apps/api
--
-- (lê as senhas do .env e chama `docker compose exec ... psql -f /roles.sql`).
-- As senhas nunca ficam neste arquivo nem em nenhum lugar versionado.
--
-- Nota: a substituição de variável do psql (:'var') não funciona dentro de
-- blocos DO $$ ... $$ (dollar-quoting) — por isso o CREATE ROLE idempotente
-- é montado como texto e executado via \gexec, em vez de um bloco DO.

SELECT 'CREATE ROLE aet_hub_app LOGIN PASSWORD ' || quote_literal(:'app_password') ||
       ' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS'
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'aet_hub_app')
\gexec

SELECT 'CREATE ROLE aet_hub_auth LOGIN PASSWORD ' || quote_literal(:'auth_password') ||
       ' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS'
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'aet_hub_auth')
\gexec

GRANT CONNECT ON DATABASE aet_hub TO aet_hub_app, aet_hub_auth;
GRANT USAGE ON SCHEMA public TO aet_hub_app, aet_hub_auth;

-- aet_hub_app é a role de runtime autenticada: acesso amplo às tabelas,
-- restrito de fato pelas policies de RLS (aplicadas na migration
-- rls_policies, depois que as tabelas existirem).
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aet_hub_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO aet_hub_app;

-- aet_hub_auth NÃO recebe privilégio amplo por padrão (sem
-- ALTER DEFAULT PRIVILEGES): o acesso dela é concedido tabela a tabela,
-- só onde o fluxo de autenticação realmente precisa (ver migration
-- rls_policies, GRANT explícito em `users`). Isso é o que garante que
-- essa role fica de fato restrita, não só "restrita por policy".
