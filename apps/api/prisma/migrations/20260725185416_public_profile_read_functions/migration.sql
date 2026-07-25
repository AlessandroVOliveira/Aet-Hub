-- Perfil público de terceiros (RF-29): a RLS de users/profiles só libera
-- self/ADMIN/colega-de-torneio — um terceiro visitando /perfil/:userId a
-- partir do /ranking não se enquadra em nenhum desses casos. Mesma técnica
-- de app_dm_recipient_display_name()/app_points_leaderboard(): função
-- SECURITY DEFINER como fronteira de exposição estreita, nunca forjar
-- role pra bypassar a RLS de verdade. Nunca devolver email/password_hash/
-- CEP — só os campos de "cartão de visita" público.
--
-- Inclusão idêntica a app_points_leaderboard(): só PLAYER ativo
-- não-deletado (banido/excluído -> nenhuma linha -> 404 no service, mesma
-- semântica de "não existe" já usada em outros lugares do projeto).
CREATE FUNCTION app_public_profile_snapshot(target_user_id TEXT)
RETURNS TABLE (
  username           TEXT,
  display_name       TEXT,
  favorite_game_name TEXT,
  favorite_character TEXT,
  theme              TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    u.username,
    p.display_name,
    g.name AS favorite_game_name,
    p.favorite_character,
    p.theme
  FROM users u
  JOIN profiles p ON p.user_id = u.id
  LEFT JOIN games g ON g.id = p.favorite_game_id
  WHERE u.id = target_user_id
    AND u.role = 'PLAYER'
    AND u.is_active
    AND u.deleted_at IS NULL;
$$;

REVOKE ALL ON FUNCTION app_public_profile_snapshot(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_public_profile_snapshot(TEXT) TO aet_hub_app;

-- follows_self_select só libera linhas onde o SESSION é follower ou
-- following — um terceiro nunca enxerga o par de outra pessoa, nem pra
-- contar. Função contagem-só (sem conteúdo de linha) é o mínimo de
-- exposição possível pro card de perfil público mostrar "N seguidores".
CREATE FUNCTION app_follow_counts(target_user_id TEXT)
RETURNS TABLE (
  followers_count BIGINT,
  following_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM follows WHERE following_id = target_user_id) AS followers_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = target_user_id) AS following_count;
$$;

REVOKE ALL ON FUNCTION app_follow_counts(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_follow_counts(TEXT) TO aet_hub_app;
