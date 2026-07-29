-- Eliminação dupla: destino do perdedor na chave de perdedores. Só
-- preenchido em partidas da chave de vencedores (WB) — nullable porque
-- partidas da LB/grande final não têm um slot de destino fixo pro
-- perdedor (LB: eliminado; GF: decidido em runtime).
ALTER TABLE "matches" ADD COLUMN "loser_bracket_slot_id" TEXT;

ALTER TABLE "matches" ADD CONSTRAINT "matches_loser_bracket_slot_id_fkey" FOREIGN KEY ("loser_bracket_slot_id") REFERENCES "bracket_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
