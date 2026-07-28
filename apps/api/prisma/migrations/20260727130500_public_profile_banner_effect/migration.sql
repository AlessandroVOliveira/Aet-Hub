-- Estende app_public_profile_snapshot de novo (armário cosmético, fatia 4)
-- pra incluir banner e efeito equipados no perfil público de terceiros —
-- as duas últimas categorias do armário, fecham o loadout completo.
-- Diferente de fonte/mascote (fatia 3), banner/efeito não propagam pro
-- ranking (app_points_leaderboard não precisa de migration nova aqui) —
-- ficam só nos dois perfis (próprio via profileDetailInclude, público via
-- esta função), mesma decisão já documentada no CLAUDE.md.
--
-- Mesmo gotcha de sempre: CREATE OR REPLACE FUNCTION não aceita mudar o
-- row type dos OUT parameters de um RETURNS TABLE existente, mesmo só
-- acrescentando coluna no fim — precisa de DROP FUNCTION antes do CREATE,
-- e REVOKE/GRANT refeitos (não sobrevivem ao drop).
DROP FUNCTION app_public_profile_snapshot(TEXT);

CREATE FUNCTION app_public_profile_snapshot(target_user_id TEXT)
RETURNS TABLE (
  username           TEXT,
  display_name       TEXT,
  favorite_game_name TEXT,
  favorite_character TEXT,
  theme              TEXT,
  equipped_frame_id  TEXT,
  equipped_title_id  TEXT,
  equipped_font_id   TEXT,
  equipped_mascot_id TEXT,
  equipped_banner_id TEXT,
  equipped_effect_id TEXT
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
    p.theme,
    p.equipped_frame_id,
    p.equipped_title_id,
    p.equipped_font_id,
    p.equipped_mascot_id,
    p.equipped_banner_id,
    p.equipped_effect_id
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
