// Valores fixos de XP por evento (RF-29), deliberadamente independentes de
// Tournament.pointsPerWin/pointsPerLoss/placementRewards — XP é uma moeda
// de progressão separada dos pontos/moedas da loja. Ajustar aqui não afeta
// nenhum torneio já concluído (XpTransaction é ledger append-only).
export const XP_PER_LEVEL = 500;

export const XP_MATCH_WIN = 50;
export const XP_MATCH_LOSS = 10;
export const XP_PARTICIPATION = 25;

export const XP_PLACEMENT_BY_TIER: Record<number, number> = {
  1: 200,
  2: 120,
  3: 80,
};
