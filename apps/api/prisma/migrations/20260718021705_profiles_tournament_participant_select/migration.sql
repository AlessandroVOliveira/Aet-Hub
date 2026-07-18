-- Terceira e última peça do fix de visibilidade de oponente (RF-27/RF-34):
-- `registrationSeatSelect` (matches.repository.ts) inclui
-- `user.profile.displayName`. Sem policy correspondente em `profiles`,
-- User.profile de um adversário (relação opcional) vinha silenciosamente
-- `null` pela RLS — sem quebrar a request (profile é opcional, diferente
-- de Registration.user, que é obrigatória), mas o `displayName` do
-- adversário nunca aparecia no histórico/chave, mesmo a linha existindo.
-- Mesmo princípio das duas migrations anteriores (registrations/users):
-- reaproveita app_current_user_tournament_ids(), sem risco de recursão
-- (policy é sobre `profiles`, tabela diferente da consultada pela
-- função).
CREATE POLICY profiles_tournament_participant_select ON profiles
  FOR SELECT TO aet_hub_app
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.user_id = profiles.user_id
        AND r.tournament_id IN (SELECT app_current_user_tournament_ids())
    )
  );
