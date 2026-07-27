-- Estende app_public_profile_snapshot (migration public_profile_read_functions)
-- pra incluir o loadout equipado (armário cosmético, fatia 1) no perfil
-- público de terceiros. CREATE OR REPLACE preserva os privilégios já
-- concedidos (REVOKE ALL FROM PUBLIC + GRANT EXECUTE TO aet_hub_app) — não
-- repetir aqui. Colunas novas só no FIM do RETURNS TABLE, pra não quebrar
-- quem já lê as colunas antigas por nome.
--
-- Só os ids voltam daqui — o repository resolve nome/raridade/className
-- contra cosmetic_items (catálogo público, RLS já libera qualquer sessão
-- autenticada, sem precisar de outra função SECURITY DEFINER pra isso).
--
-- Gotcha real: CREATE OR REPLACE FUNCTION não aceita mudar o row type dos
-- OUT parameters de um RETURNS TABLE existente (Postgres exige DROP
-- primeiro), mesmo só ACRESCENTANDO colunas no fim — diferente de trocar
-- o corpo de uma função com a MESMA assinatura (caso de
-- app_create_notification, que não muda RETURNS TABLE). GRANT/REVOKE
-- precisam ser refeitos depois do DROP+CREATE (não sobrevivem ao drop).
DROP FUNCTION app_public_profile_snapshot(TEXT);

CREATE FUNCTION app_public_profile_snapshot(target_user_id TEXT)
RETURNS TABLE (
  username           TEXT,
  display_name       TEXT,
  favorite_game_name TEXT,
  favorite_character TEXT,
  theme              TEXT,
  equipped_frame_id  TEXT,
  equipped_title_id  TEXT
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
    p.equipped_title_id
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
