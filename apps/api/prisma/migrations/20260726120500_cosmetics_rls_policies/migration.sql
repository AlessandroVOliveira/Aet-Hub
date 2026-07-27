-- RLS para o Armário Cosmético (fatia 1: bordas + títulos). Ordem
-- obrigatória por tabela (lição da Fatia 13, repetida em toda tabela
-- nova): REVOKE dos default privileges PRIMEIRO (ALTER DEFAULT PRIVILEGES
-- de roles.sql concede SELECT/INSERT/UPDATE/DELETE a toda tabela nova) e
-- só então GRANT estreito.

-- ---------------------------------------------------------------------
-- cosmetic_items: catálogo de escrita admin, mesmo padrão de
-- achievements/games/store_items. Sem DELETE de propósito — item se
-- desativa (isActive), nunca se apaga.
-- ---------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON cosmetic_items FROM aet_hub_app;
GRANT SELECT, INSERT, UPDATE ON cosmetic_items TO aet_hub_app;

ALTER TABLE cosmetic_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosmetic_items FORCE ROW LEVEL SECURITY;

CREATE POLICY cosmetic_items_authenticated_select ON cosmetic_items
  FOR SELECT TO aet_hub_app
  USING (current_setting('app.current_user_id', true) <> '');

CREATE POLICY cosmetic_items_admin_insert ON cosmetic_items
  FOR INSERT TO aet_hub_app
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

CREATE POLICY cosmetic_items_admin_update ON cosmetic_items
  FOR UPDATE TO aet_hub_app
  USING (current_setting('app.current_role', true) = 'ADMIN')
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

-- ---------------------------------------------------------------------
-- user_cosmetic_items: posse por compra, imutável (sem UPDATE/DELETE em
-- lugar nenhum). Leitura self-or-admin, mesmo padrão de
-- points_transactions_self_or_admin_select. Escrita: policy admin base
-- (flexibilidade futura pra concessão manual, ver AskUserQuestion da
-- fatia) + policy aditiva de auto-compra — o próprio player inicia a
-- compra, mesmo racional de points_transactions_self_redemption_insert:
-- tipo/coluna fixos por semântica (aqui, o item precisa ser comprável de
-- verdade: ativo e com preço > 0 — item grátis padrão ou só-por-conquista
-- nunca passa por INSERT nesta tabela, é posse derivada em código).
-- ---------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON user_cosmetic_items FROM aet_hub_app;
GRANT SELECT, INSERT ON user_cosmetic_items TO aet_hub_app;

ALTER TABLE user_cosmetic_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cosmetic_items FORCE ROW LEVEL SECURITY;

CREATE POLICY user_cosmetic_items_self_or_admin_select ON user_cosmetic_items
  FOR SELECT TO aet_hub_app
  USING (
    user_id = current_setting('app.current_user_id', true)
    OR current_setting('app.current_role', true) = 'ADMIN'
  );

CREATE POLICY user_cosmetic_items_admin_insert ON user_cosmetic_items
  FOR INSERT TO aet_hub_app
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

CREATE POLICY user_cosmetic_items_self_purchase_insert ON user_cosmetic_items
  FOR INSERT TO aet_hub_app
  WITH CHECK (
    user_id = current_setting('app.current_user_id', true)
    AND EXISTS (
      SELECT 1 FROM cosmetic_items c
      WHERE c.id = cosmetic_item_id
        AND c.is_active
        AND c.price_in_points > 0
    )
  );

-- ---------------------------------------------------------------------
-- points_transactions: policy aditiva pro débito de compra de cosmético,
-- mesmo molde de points_transactions_self_redemption_insert (migration
-- points_transactions_self_redemption_insert) — não substitui a policy
-- de ADMIN existente, só soma mais uma porta de entrada estreita.
-- ---------------------------------------------------------------------
CREATE POLICY points_transactions_self_cosmetic_purchase_insert ON points_transactions
  FOR INSERT TO aet_hub_app
  WITH CHECK (
    type = 'COSMETIC_PURCHASE'
    AND amount < 0
    AND user_id = current_setting('app.current_user_id', true)
    AND user_cosmetic_item_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM user_cosmetic_items uci
      WHERE uci.id = user_cosmetic_item_id
        AND uci.user_id = current_setting('app.current_user_id', true)
    )
  );
