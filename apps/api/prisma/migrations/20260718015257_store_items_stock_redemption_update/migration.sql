-- Habilita o player decrementar o próprio estoque de um item ao resgatar
-- (RF-24) sem precisar de role ADMIN. store_items só tinha, até aqui,
-- leitura pública + escrita admin-only (bloco genérico da migration
-- `rls_policies`) — bug descoberto em teste manual: decrementStoreItemStock
-- (store.repository.ts), chamado durante o resgate iniciado pelo player,
-- era silenciosamente filtrado pela RLS (UPDATE sob RLS não dá erro de
-- permissão quando a policy não casa a linha, só afeta zero linhas — o
-- app interpretava isso como "sem estoque" mesmo com estoque disponível).
--
-- Mesmo princípio já aplicado a points_transactions
-- (points_transactions_self_redemption_insert): policy nova e aditiva
-- (combinada via OR com store_items_admin_update, sem tocar nela), o mais
-- estreita possível para o caso de uso real. Postgres RLS não permite
-- referenciar o valor ANTIGO da linha (OLD.stock) dentro do WITH CHECK de
-- uma policy declarativa (só um trigger faria isso) — então esta policy
-- não consegue garantir sozinha que o UPDATE mexeu só na coluna `stock`
-- e decrementou exatamente 1; a garantia de "só a coluna stock, só -1 por
-- vez" vem da aplicação (decrementStoreItemStock é o único código que
-- gera este tipo de UPDATE com role não-admin). A policy garante pelo
-- menos que a linha só é elegível com estoque positivo (USING) e que o
-- resultado nunca fica negativo/nulo (WITH CHECK).
CREATE POLICY store_items_stock_redemption_update ON store_items
  FOR UPDATE TO aet_hub_app
  USING (stock IS NOT NULL AND stock > 0)
  WITH CHECK (stock IS NOT NULL AND stock >= 0);
