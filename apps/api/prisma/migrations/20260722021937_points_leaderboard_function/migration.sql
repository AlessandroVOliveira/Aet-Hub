-- Ranking global de pontos (RF-30): qualquer autenticado vê o leaderboard,
-- mas a RLS de points_transactions só deixa cada player ler as próprias
-- transações — um GROUP BY global via aet_hub_app retornaria só a própria
-- linha. Mesmo dilema já resolvido em app_current_user_tournament_ids():
-- função SECURITY DEFINER (dona = aet_hub_owner, bypassa RLS) com saída
-- deliberadamente estreita — SÓ colunas públicas de leaderboard (username,
-- display_name, soma de pontos); nunca email, password_hash ou transações
-- individuais. Esta função é a fronteira de exposição, não a RLS.
--
-- Inclusão (decisão de produto): só PLAYER ativo não-deletado; admins fora.
-- LEFT JOIN em points_transactions inclui quem tem 0 transações (0 pts).
-- RANK(): empatados dividem a posição (com lacuna depois). Desempate de
-- ordem das linhas determinístico: created_at ASC, username ASC.
--
-- `position` precisa de aspas duplas em RETURNS TABLE/no alias do SELECT:
-- testado direto no psql, sem aspas dá "syntax error at or near position"
-- (POSITION é palavra reservada por causa da sintaxe SQL-standard
-- POSITION(x IN y), mesmo sendo categoria "unreserved" na maioria dos
-- outros contextos).
CREATE FUNCTION app_points_leaderboard()
RETURNS TABLE (
  user_id TEXT,
  username TEXT,
  display_name TEXT,
  points BIGINT,
  "position" BIGINT
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
    RANK() OVER (ORDER BY COALESCE(SUM(pt.amount), 0) DESC) AS "position"
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
