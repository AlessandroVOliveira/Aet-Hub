import type { Prisma } from '@prisma/client';
import { withRls } from '../../config/rls.js';
import { getSocketServer } from '../../config/socket.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as tournamentsRepository from '../tournaments/tournaments.repository.js';
import * as matchesRepository from './matches.repository.js';
import * as bracketGenerator from './bracket-generator.js';
import * as placementCalculator from './placement-calculator.js';
import type { PlacementResult, MatchOutcome } from './placement-calculator.js';
import type { RecordMatchResultInput } from './matches.schemas.js';

function broadcastBracketUpdated(tournamentId: string): void {
  const io = getSocketServer();
  if (!io) return; // best-effort — scripts fora do server HTTP não têm socket
  io.of('/tournaments').to(`tournament:${tournamentId}`).emit('bracket:updated', { tournamentId });
}

// Chamada por tournaments.service.startTournament, já dentro da transação
// aberta pelo withRls dele — não abre a própria transação.
export async function generateBracket(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  registrationIds: string[],
) {
  const plan = bracketGenerator.computeBracketPlan(registrationIds);

  const slotIdByRoundPosition = new Map<string, string>();
  for (let round = 1; round <= plan.totalRounds; round++) {
    const slotsInRound = plan.bracketSize / 2 ** (round - 1);
    for (let position = 1; position <= slotsInRound; position++) {
      const slot = await matchesRepository.createBracketSlot(tx, { tournamentId, round, position });
      slotIdByRoundPosition.set(`${round}-${position}`, slot.id);
    }
  }

  for (const seat of plan.round1Seats) {
    if (seat.registrationId) {
      await matchesRepository.updateBracketSlotRegistration(
        tx,
        slotIdByRoundPosition.get(`1-${seat.position}`)!,
        seat.registrationId,
      );
    }
  }

  for (const pair of plan.matchPairs) {
    await matchesRepository.createMatch(tx, {
      tournamentId,
      bracketSlotId: slotIdByRoundPosition.get(`2-${pair.pairIndex}`)!,
      registrationAId: pair.registrationAId,
      registrationBId: pair.registrationBId,
    });
  }

  for (const bye of plan.byes) {
    const nextSlotId = slotIdByRoundPosition.get(`2-${bye.pairIndex}`)!;
    await matchesRepository.updateBracketSlotRegistration(tx, nextSlotId, bye.registrationId);
    await bracketGenerator.maybeCreateNextRoundMatch(tx, tournamentId, 2, bye.pairIndex);
  }

  await tournamentsRepository.updateTournamentStatus(tx, tournamentId, 'IN_PROGRESS');
  broadcastBracketUpdated(tournamentId);

  return matchesRepository.findBracketByTournamentId(tx, tournamentId);
}

export async function getBracket(actor: AccessTokenPayload, tournamentId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const tournament = await tournamentsRepository.findTournamentById(tx, tournamentId);
    if (!tournament) {
      throw new AppError('Torneio não encontrado', 404);
    }
    return matchesRepository.findBracketByTournamentId(tx, tournamentId);
  });
}

export async function recordMatchResult(
  actor: AccessTokenPayload,
  matchId: string,
  input: RecordMatchResultInput,
) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const match = await matchesRepository.findMatchById(tx, matchId);
    if (!match) {
      throw new AppError('Partida não encontrada', 404);
    }
    if (match.status !== 'SCHEDULED') {
      throw new AppError('Resultado já registrado para esta partida', 409);
    }
    if (
      input.winnerRegistrationId !== match.registrationAId &&
      input.winnerRegistrationId !== match.registrationBId
    ) {
      throw new AppError('Vencedor informado não participa desta partida', 400);
    }

    const updatedMatch = await matchesRepository.updateMatchResult(tx, matchId, {
      winnerRegistrationId: input.winnerRegistrationId,
      scoreA: input.scoreA,
      scoreB: input.scoreB,
    });

    const targetSlot = await matchesRepository.findBracketSlotById(tx, match.bracketSlotId);
    await matchesRepository.updateBracketSlotRegistration(
      tx,
      match.bracketSlotId,
      input.winnerRegistrationId,
    );
    await bracketGenerator.maybeCreateNextRoundMatch(
      tx,
      match.tournamentId,
      targetSlot.round,
      targetSlot.position,
    );

    broadcastBracketUpdated(match.tournamentId);
    return updatedMatch;
  });
}

export interface FinalPlacementsResult {
  placements: PlacementResult[];
  matchOutcomes: MatchOutcome[];
}

// Chamada por tournaments.service.completeTournament, já dentro da
// transação aberta pelo withRls dele — não abre a própria transação
// (mesmo padrão de generateBracket ser chamado por startTournament).
export async function computeFinalPlacements(
  tx: Prisma.TransactionClient,
  tournamentId: string,
): Promise<FinalPlacementsResult> {
  const finalMatch = await matchesRepository.findFinalMatch(tx, tournamentId);
  if (!finalMatch || finalMatch.status !== 'COMPLETED') {
    throw new AppError(
      'A partida final ainda não foi registrada — não é possível encerrar o torneio',
      409,
    );
  }

  const completed = await matchesRepository.findCompletedMatchesWithRound(tx, tournamentId);
  const matchOutcomes: MatchOutcome[] = completed.map((match) => ({
    matchId: match.id,
    round: match.bracketSlot.round,
    registrationAId: match.registrationAId!,
    registrationBId: match.registrationBId!,
    winnerRegistrationId: match.winnerRegistrationId!,
  }));

  return {
    placements: placementCalculator.computePlacements(matchOutcomes),
    matchOutcomes,
  };
}
