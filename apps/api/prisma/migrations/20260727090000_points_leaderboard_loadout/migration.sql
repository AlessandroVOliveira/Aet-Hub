-- Estende app_points_leaderboard (migration points_leaderboard_function)
-- pra devolver o loadout equipado (armário cosmético, fatia 2) junto com
-- cada linha do ranking. Só os ids voltam daqui — mesmo padrão de
-- app_public_profile_snapshot (migration public_profile_loadout):
-- ranking.repository.ts resolve nome/className/rarity contra
-- cosmetic_items (catálogo público, sem RLS pra se preocupar).
--
-- Mesmo gotcha já documentado: CREATE OR REPLACE FUNCTION não aceita
-- mudar o row type dos OUT parameters de um RETURNS TABLE existente,
-- mesmo só acrescentando colunas no fim — precisa de DROP FUNCTION antes
-- do CREATE, e REVOKE/GRANT refeitos (não sobrevivem ao drop).
DROP FUNCTION app_points_leaderboard();

CREATE FUNCTION app_points_leaderboard()
RETURNS TABLE (
  user_id TEXT,
  username TEXT,
  display_name TEXT,
  points BIGINT,
  "position" BIGINT,
  equipped_frame_id TEXT,
  equipped_title_id TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    u.id,
    u.username,
    p.display_name,
    COALESCE(SUM(pt.amount), 0) AS points,
    RANK() OVER (ORDER BY COALESCE(SUM(pt.amount), 0) DESC) AS "position",
    p.equipped_frame_id,
    p.equipped_title_id
  FROM users u
  LEFT JOIN profiles p ON p.user_id = u.id
  LEFT JOIN points_transactions pt ON pt.user_id = u.id
  WHERE u.role = 'PLAYER'
    AND u.is_active
    AND u.deleted_at IS NULL
  GROUP BY u.id, p.id
  ORDER BY points DESC, u.created_at ASC, u.username ASC
$$;

REVOKE ALL ON FUNCTION app_points_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_points_leaderboard() TO aet_hub_app;
