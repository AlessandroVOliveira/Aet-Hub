-- Bug descoberto em teste manual desta fatia: GET /users/me/history (RF-27)
-- falhava com 500 ("Field user is required to return data, got null
-- instead") sempre que a Registration do player tinha um Checkin feito
-- por um admin. registrations.repository.ts inclui `checkin: true`
-- (sem select aninhado, nunca pediu checkedInBy) — mas o query engine do
-- Prisma, ao montar a linha de Checkin (relação obrigatória
-- Checkin.checkedInBy -> User), valida a FK internamente e trava quando a
-- policy de users (users_self_or_admin_select: só o próprio usuário ou
-- ADMIN) esconde a linha do admin de uma sessão PLAYER — mesmo sem esse
-- campo nunca aparecer no JSON de resposta (a policy do Postgres é
-- row-level, avaliada antes da aplicação decidir o que serializar).
--
-- Fix: liberar leitura de linhas com role = 'ADMIN' para qualquer sessão
-- autenticada (aditiva, OR com users_self_or_admin_select existente).
-- Seguro apesar de ser row-level (não column-level): nenhum código deste
-- projeto usa aet_hub_app pra selecionar password_hash/email de outro
-- usuário (login/cadastro passam pela role separada aet_hub_auth, nunca
-- aet_hub_app) — o risco é só teórico ao nível de RLS, não explorável via
-- nenhum caminho de código real hoje. Identidade de staff/admin (quem fez
-- seu checkin, quem criou o torneio) não é dado sensível o suficiente pra
-- justificar a complexidade de uma policy mais estreita.
CREATE POLICY users_admin_visible_to_authenticated ON users
  FOR SELECT TO aet_hub_app
  USING (role = 'ADMIN');
