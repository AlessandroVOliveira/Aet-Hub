-- RLS para direct_messages (RF-38). GRANT explícito porque o
-- GRANT ... ON ALL TABLES da migration rls_policies original não retroage
-- para tabelas novas. Fora de escopo desta fatia (registrado): read
-- receipts, contador de não lidas, presença online.
GRANT SELECT, INSERT ON direct_messages TO aet_hub_app;

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages FORCE ROW LEVEL SECURITY;

-- Só os dois participantes enxergam a mensagem. Guard de string vazia como
-- em chat_messages: sessão sem set_config retorna NULL e NULL <> '' nega.
CREATE POLICY direct_messages_participant_select ON direct_messages
  FOR SELECT TO aet_hub_app
  USING (
    current_setting('app.current_user_id', true) <> ''
    AND (
      sender_id = current_setting('app.current_user_id', true)
      OR recipient_id = current_setting('app.current_user_id', true)
    )
  );

-- Só insere como si mesmo e nunca para si mesmo. Validade do destinatário
-- (ativo/não deletado) é regra de negócio checada no service via
-- app_dm_recipient_display_name(); aqui a FK já garante existência.
CREATE POLICY direct_messages_sender_insert ON direct_messages
  FOR INSERT TO aet_hub_app
  WITH CHECK (
    current_setting('app.current_user_id', true) <> ''
    AND sender_id = current_setting('app.current_user_id', true)
    AND recipient_id <> sender_id
  );

-- Imutável nesta fatia — moderação (RF-25/RF-40) fará migration própria.
REVOKE UPDATE, DELETE ON direct_messages FROM aet_hub_app;

-- O remetente em geral NÃO enxerga users/profiles do destinatário via RLS
-- (visibilidade é só "colegas de torneio"). Mesma técnica de
-- app_points_leaderboard(): SECURITY DEFINER como fronteira de exposição
-- estreita — devolve SÓ display_name, e só de conta ativa. NULL = inválido.
-- Parâmetro nomeado target_user_id para nunca colidir com nome de coluna.
CREATE FUNCTION app_dm_recipient_display_name(target_user_id TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.display_name
  FROM users u
  JOIN profiles p ON p.user_id = u.id
  WHERE u.id = target_user_id
    AND u.is_active
    AND u.deleted_at IS NULL;
$$;

REVOKE ALL ON FUNCTION app_dm_recipient_display_name(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_dm_recipient_display_name(TEXT) TO aet_hub_app;