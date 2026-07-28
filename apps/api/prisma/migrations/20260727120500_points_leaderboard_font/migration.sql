-- Estende app_points_leaderboard de novo (armário cosmético, fatia 3) pra
-- devolver também o id da fonte equipada. Sem mascote aqui de propósito:
-- ranking usa PlayerBadge, um avatar compacto de 24px — o emoji do
-- mascote (desenhado a ~24px sobre um avatar de 96px no design de
-- referência) ficaria ilegível nessa escala, então mascote só propaga pra
-- /perfil e /perfil/:userId (ver public_profile_font_mascot).
--
-- Mesmo gotcha de sempre: CREATE OR REPLACE FUNCTION não aceita mudar o
-- row type dos OUT parameters de um RETURNS TABLE existente, mesmo só
-- acrescentando coluna no fim — precisa de DROP FUNCTION antes do CREATE,
-- e REVOKE/GRANT refeitos (não sobrevivem ao drop).
DROP FUNCTION app_points_leaderboard();

CREATE FUNCTION app_points_leaderboard()
RETURNS TABLE (
  user_id TEXT,
  username TEXT,
  display_name TEXT,
  points BIGINT,
  "position" BIGINT,
  equipped_frame_id TEXT,
  equipped_title_id TEXT,
  equipped_font_id TEXT
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
    p.equipped_title_id,
    p.equipped_font_id
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
