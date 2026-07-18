-- Habilita o player iniciar o próprio débito de moedas ao resgatar um item
-- da loja (RF-24), sem enfraquecer a policy existente para ADMIN
-- (points_transactions_admin_insert, migration `rls_policies`) — policies
-- permissivas em Postgres são combinadas com OR, então isto só ADICIONA
-- uma segunda porta de entrada estreita, sem substituir nem remover nada.
--
-- Por que o player insere a própria linha em vez do backend "forjar" um
-- contexto de admin: manter app.current_role fiel ao ator real da request
-- é o que dá sentido a RLS como camada de segurança de verdade (ver
-- CLAUDE.md). Em vez de elevar privilégio na aplicação, a policy é
-- estreitada ao máximo — princípio a seguir em qualquer fatia futura que
-- gere PointsTransaction por iniciativa do próprio usuário: tipo fixo,
-- sinal do amount compatível com a semântica do tipo, e vínculo validado
-- via EXISTS contra a linha "pai" que autoriza a operação.
CREATE POLICY points_transactions_self_redemption_insert ON points_transactions
  FOR INSERT TO aet_hub_app
  WITH CHECK (
    type = 'REDEMPTION'
    AND amount < 0
    AND user_id = current_setting('app.current_user_id', true)
    AND redemption_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM redemptions r
      WHERE r.id = redemption_id
        AND r.user_id = current_setting('app.current_user_id', true)
    )
  );
