// Pura, sem acesso a banco — recebe contexto já buscado por
// tournaments.service.ts#completeTournament, testável isoladamente como
// matches/placement-calculator.ts. Só 3 conquistas nesta fatia (RF-29),
// todas avaliadas a partir de dados que completeTournament já tem em mãos;
// gatilhos fora do fechamento de torneio (seguir players, comentar etc.)
// ficam para uma fatia futura.
export const FIRST_TOURNAMENT_CODE = 'FIRST_TOURNAMENT';
export const FIRST_WIN_CODE = 'FIRST_WIN';
export const CHAMPION_CODE = 'CHAMPION';

export const ACHIEVEMENT_CODES = [FIRST_TOURNAMENT_CODE, FIRST_WIN_CODE, CHAMPION_CODE] as const;

export interface AchievementUnlock {
  userId: string;
  achievementCode: string;
  achievementId: string;
  tournamentId: string;
}

export function evaluateAchievementUnlocks(params: {
  tournamentId: string;
  matchOutcomes: { winnerRegistrationId: string }[];
  placements: { registrationId: string; placement: number }[];
  userIdByRegistrationId: Map<string, string>;
  // Vitórias/torneios PRÉVIOS (antes desta finalização) — ver
  // xp.repository.ts#countPriorMatchWinsByUserIds e
  // tournaments.repository.ts#countPriorCompletedTournamentsByUserIds.
  priorMatchWinCountByUserId: Map<string, number>;
  priorCompletedTournamentCountByUserId: Map<string, number>;
  // Só os códigos do catálogo que estão ativos (achievements.repository
  // .findAchievementsByCodes) — código sem entrada aqui simplesmente não
  // é concedido (catálogo desativado ou nunca seedado).
  achievementIdByCode: Map<string, string>;
  // Chaves "userId:achievementId" já desbloqueadas antes desta finalização
  // (achievements.repository.findExistingUnlocks) — mutada in-place pra
  // evitar duplicata dentro do próprio lote também.
  alreadyUnlockedKeys: Set<string>;
}): AchievementUnlock[] {
  const {
    tournamentId,
    matchOutcomes,
    placements,
    userIdByRegistrationId,
    priorMatchWinCountByUserId,
    priorCompletedTournamentCountByUserId,
    achievementIdByCode,
    alreadyUnlockedKeys,
  } = params;

  const unlocks: AchievementUnlock[] = [];
  const winnersUserIds = new Set(
    matchOutcomes.map((outcome) => userIdByRegistrationId.get(outcome.winnerRegistrationId)!),
  );

  const tryUnlock = (userId: string, code: string): void => {
    const achievementId = achievementIdByCode.get(code);
    if (!achievementId) return;
    const key = `${userId}:${achievementId}`;
    if (alreadyUnlockedKeys.has(key)) return;
    alreadyUnlockedKeys.add(key);
    unlocks.push({ userId, achievementCode: code, achievementId, tournamentId });
  };

  for (const { registrationId, placement } of placements) {
    const userId = userIdByRegistrationId.get(registrationId)!;

    // "Primeiro torneio": nenhum torneio anterior com colocação final.
    if ((priorCompletedTournamentCountByUserId.get(userId) ?? 0) === 0) {
      tryUnlock(userId, FIRST_TOURNAMENT_CODE);
    }

    // "Primeira vitória": venceu ao menos uma partida NESTE torneio e
    // nunca tinha vencido nenhuma antes.
    if (winnersUserIds.has(userId) && (priorMatchWinCountByUserId.get(userId) ?? 0) === 0) {
      tryUnlock(userId, FIRST_WIN_CODE);
    }

    // "Campeão": 1º lugar nesta finalização.
    if (placement === 1) {
      tryUnlock(userId, CHAMPION_CODE);
    }
  }

  return unlocks;
}
