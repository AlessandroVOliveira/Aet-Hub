-- Eliminação dupla: um terceiro valor de BracketSide pra representar a
-- grande final (WB campeão x LB campeão, com possível reset de chave) —
-- distinto de WINNERS/LOSERS, nunca sobreposto a nenhum dos dois.
ALTER TYPE "BracketSide" ADD VALUE 'GRAND_FINAL';
