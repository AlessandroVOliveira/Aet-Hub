-- Corrige um segundo bug encontrado na verificação fim a fim da Fatia 13:
-- roles.sql roda `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT,
-- INSERT, UPDATE, DELETE ON TABLES TO aet_hub_app` — isso se aplica
-- automaticamente a QUALQUER tabela nova criada pela role dona (o mesmo
-- comportamento que já fez outras migrations, ex. direct_messages, terem
-- que fazer REVOKE explícito do que a policy não deveria conceder). A
-- migration notifications_rls_policies só GRANTOU SELECT e UPDATE(read_at)
-- mas nunca REVOGOU o INSERT/UPDATE(full)/DELETE que vieram de graça do
-- default privilege — testado via psql: `\dp notifications` mostrava
-- aet_hub_app com "arwd" (SELECT+INSERT+UPDATE+DELETE) na tabela inteira,
-- não só SELECT + UPDATE(read_at) como o comentário da migration original
-- prometia. Isso esvaziava duas garantias de design ao mesmo tempo: "só a
-- função SECURITY DEFINER cria notificação" (INSERT direto funcionava) e
-- "só read_at é editável" (UPDATE de title/body funcionava). REVOKE geral
-- primeiro, GRANT column-scoped depois — mesma ordem de
-- direct_messages_rls_policies.
REVOKE INSERT, UPDATE, DELETE ON notifications FROM aet_hub_app;
GRANT UPDATE (read_at) ON notifications TO aet_hub_app;
