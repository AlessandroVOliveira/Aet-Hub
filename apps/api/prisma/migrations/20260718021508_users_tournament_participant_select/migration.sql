-- Segunda metade do fix de visibilidade de oponente (RF-27/RF-34): a
-- migration `registrations_tournament_participant_select` liberou ver a
-- Registration de outro participante do mesmo torneio, mas
-- matches.repository.ts também precisa resolver a relação obrigatória
-- Registration.user (registrationSeatSelect inclui `user: {...}`) — sem
-- policy correspondente em `users`, o Prisma falhava com "Field user is
-- required to return data, got null instead" ao montar o adversário no
-- histórico do player (GET /users/me/history), porque a linha de
-- `users` do adversário (um PLAYER, não ADMIN) continuava invisível pela
-- policy existente (users_self_or_admin_select / users_admin_visible_to_authenticated).
--
-- Reaproveita a função SECURITY DEFINER já criada
-- (app_current_user_tournament_ids) — sem risco de recursão aqui porque a
-- policy é sobre `users`, não sobre `registrations` (a tabela que a
-- função consulta internamente, bypassando RLS por rodar com privilégio
-- do dono/superuser).
CREATE POLICY users_tournament_participant_select ON users
  FOR SELECT TO aet_hub_app
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.user_id = users.id
        AND r.tournament_id IN (SELECT app_current_user_tournament_ids())
    )
  );
