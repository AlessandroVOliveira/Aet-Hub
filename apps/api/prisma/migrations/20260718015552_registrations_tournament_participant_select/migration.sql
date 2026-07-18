-- Habilita um player ver as Registrations de OUTROS players do mesmo
-- torneio (necessário pra RF-34 "próximo adversário" e RF-27 "histórico
-- de partidas com adversário") — bug descoberto em teste manual desta
-- fatia: sem isso, o campo `opponent` no histórico do player (e o nome do
-- adversário na visualização de chave, RF-34, ambos lendo Match.
-- registrationA/registrationB via matches.repository.ts) vinha sempre
-- null pra não-admin, porque a RLS de registrations só liberava a própria
-- inscrição. Isso já estava previsto no comentário da migration
-- `rls_policies` original ("... vai ser preciso liberar leitura parcial
-- ... para outros players do mesmo torneio — reavaliar esta policy
-- naquele bloco"), mas não foi revisitado quando o chaveamento (Fatia 4)
-- foi implementado — os testes daquela fatia rodaram só como admin, que
-- já bypassa essa restrição, então o gap não foi pego até agora.
--
-- Aditiva (combinada via OR com registrations_self_or_admin_select, sem
-- tocar nela). Escopo amplo de propósito: qualquer participante de um
-- torneio pode ver a EXISTÊNCIA e os campos da Registration de qualquer
-- outro participante do MESMO torneio — não dá pra restringir por coluna
-- via RLS (row-level, não column-level). A coluna sensível da tabela
-- (qr_code_token, o "ingresso" de checkin de cada player) NUNCA deve ser
-- lida para a Registration de outra pessoa: a garantia disso é de
-- aplicação, não de RLS — matches.repository.ts usa `select` explícito
-- (nunca `include` bruto) sempre que lê Registration de outro usuário,
-- listando só os campos necessários (id, status, finalPlacement, dados de
-- User/Profile), nunca qr_code_token.
--
-- Implementação via função SECURITY DEFINER (não um EXISTS direto contra
-- a própria tabela): uma policy de SELECT em `registrations` que faz um
-- subselect em `registrations` de novo dispara reavaliação da RLS daquela
-- mesma tabela — Postgres detecta isso como "infinite recursion detected
-- in policy" (erro 42P17) e recusa a query inteira, mesmo a subquery
-- sendo logicamente terminante. A função abaixo roda com o privilégio do
-- dono (aet_hub_owner, superuser do container — ver docker-compose.yml,
-- POSTGRES_USER vira superuser automaticamente na imagem oficial), que
-- ignora RLS por completo, então a leitura interna não reaciona a policy
-- que está sendo avaliada.
CREATE FUNCTION app_current_user_tournament_ids()
RETURNS SETOF TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT tournament_id FROM registrations
  WHERE user_id = current_setting('app.current_user_id', true);
$$;

REVOKE ALL ON FUNCTION app_current_user_tournament_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_current_user_tournament_ids() TO aet_hub_app;

CREATE POLICY registrations_tournament_participant_select ON registrations
  FOR SELECT TO aet_hub_app
  USING (tournament_id IN (SELECT app_current_user_tournament_ids()));
