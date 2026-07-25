import type { Prisma } from '@prisma/client';
import {
  XP_MATCH_LOSS,
  XP_MATCH_WIN,
  XP_PARTICIPATION,
  XP_PLACEMENT_BY_TIER,
} from './xp-constants.js';

export interface TournamentForXpCalculation {
  id: string;
  name: string;
}

// Estrutura paralela a tournaments.service.ts#buildPointsTransactionEntries
// — mesmos dados de entrada (matchOutcomes/placements já computados por
// completeTournament), mas valores fixos (xp-constants.ts) em vez dos
// pointsPerWin/pointsPerLoss/bonusPoints configuráveis por torneio.
export function buildXpTransactionEntries(params: {
  tournament: TournamentForXpCalculation;
  matchOutcomes: {
    matchId: string;
    registrationAId: string;
    registrationBId: string;
    winnerRegistrationId: string;
  }[];
  placements: { registrationId: string; placement: number }[];
  userIdByRegistrationId: Map<string, string>;
}): Prisma.XpTransactionCreateManyInput[] {
  const { tournament, matchOutcomes, placements, userIdByRegistrationId } = params;
  const entries: Prisma.XpTransactionCreateManyInput[] = [];

  for (const outcome of matchOutcomes) {
    const loserRegistrationId =
      outcome.winnerRegistrationId === outcome.registrationAId
        ? outcome.registrationBId
        : outcome.registrationAId;

    entries.push({
      userId: userIdByRegistrationId.get(outcome.winnerRegistrationId)!,
      type: 'MATCH_WIN',
      amount: XP_MATCH_WIN,
      tournamentId: tournament.id,
      matchId: outcome.matchId,
      description: `Vitória em partida do torneio ${tournament.name}`,
    });
    entries.push({
      userId: userIdByRegistrationId.get(loserRegistrationId)!,
      type: 'MATCH_LOSS',
      amount: XP_MATCH_LOSS,
      tournamentId: tournament.id,
      matchId: outcome.matchId,
      description: `Derrota em partida do torneio ${tournament.name}`,
    });
  }

  for (const { registrationId, placement } of placements) {
    entries.push({
      userId: userIdByRegistrationId.get(registrationId)!,
      type: 'PARTICIPATION',
      amount: XP_PARTICIPATION,
      tournamentId: tournament.id,
      matchId: null,
      description: `Participação no torneio ${tournament.name}`,
    });

    const tierAmount = XP_PLACEMENT_BY_TIER[placement];
    if (tierAmount) {
      entries.push({
        userId: userIdByRegistrationId.get(registrationId)!,
        type: 'PLACEMENT',
        amount: tierAmount,
        tournamentId: tournament.id,
        matchId: null,
        description: `${placement}º lugar no torneio ${tournament.name}`,
      });
    }
  }

  return entries;
}
