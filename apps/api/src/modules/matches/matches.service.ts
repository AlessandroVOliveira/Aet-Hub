import type { Match, Notification, Prisma } from '@prisma/client';
import { withRls } from '../../config/rls.js';
import { getSocketServer } from '../../config/socket.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as tournamentsRepository from '../tournaments/tournaments.repository.js';
import * as notificationsRepository from '../notifications/notifications.repository.js';
import { emitNewNotifications } from '../notifications/notifications.emitter.js';
import * as matchesRepository from './matches.repository.js';
import * as bracketGenerator from './bracket-generator.js';
import * as placementCalculator from './placement-calculator.js';
import type { PlacementResult, MatchOutcome } from './placement-calculator.js';
import type { RecordMatchResultInput } from './matches.schemas.js';

// Exportado: tournaments.service (startTournament/completeTournament) e
// este módulo (recordMatchResult) chamam pós-commit do withRls — nunca de
// dentro da transação (fire-and-refetch antes do commit poderia refetchar
// um estado que ainda sofre rollback).
export function broadcastBracketUpdated(tournamentId: string): void {
  const io = getSocketServer();
  if (!io) return; // best-effort — scripts fora do server HTTP não têm socket
  io.of('/tournaments').to(`tournament:${tournamentId}`).emit('bracket:updated', { tournamentId });
}

// Duas notificações MATCH_READY por Match recém-criado (um pra cada lado),
// citando o adversário pelo nome. Só chamada com sessão ADMIN
// (generateBracket/recordMatchResult são sempre withRls de um endpoint
// admin) — a visibilidade ampla de users/profiles das policies
// self_or_admin já cobre findRegistrationOwners. Fallback displayName ??
// username é defensivo (profile sempre existe no fluxo real de cadastro).
async function buildMatchReadyNotifications(
  tx: Prisma.TransactionClient,
  tournament: { id: string; name: string },
  createdMatches: Match[],
): Promise<Notification[]> {
  if (createdMatches.length === 0) return [];

  const registrationIds = createdMatches.flatMap((match) => [
    match.registrationAId!,
    match.registrationBId!,
  ]);
  const owners = await matchesRepository.findRegistrationOwners(tx, registrationIds);
  const ownerByRegistrationId = new Map(
    owners.map((owner) => [
      owner.id,
      { userId: owner.userId, displayName: owner.user.profile?.displayName ?? owner.user.username },
    ]),
  );

  const notifications: Notification[] = [];
  for (const match of createdMatches) {
    const ownerA = ownerByRegistrationId.get(match.registrationAId!)!;
    const ownerB = ownerByRegistrationId.get(match.registrationBId!)!;
    const linkPath = `/torneios/${tournament.id}/chaveamento`;

    notifications.push(
      await notificationsRepository.createNotification(tx, {
        userId: ownerA.userId,
        type: 'MATCH_READY',
        title: 'Próxima disputa definida',
        body: `Torneio ${tournament.name}: você enfrenta ${ownerB.displayName}`,
        linkPath,
        refId: match.id,
      }),
    );
    notifications.push(
      await notificationsRepository.createNotification(tx, {
        userId: ownerB.userId,
        type: 'MATCH_READY',
        title: 'Próxima disputa definida',
        body: `Torneio ${tournament.name}: você enfrenta ${ownerA.displayName}`,
        linkPath,
        refId: match.id,
      }),
    );
  }
  return notifications;
}

// Chamada por tournaments.service.startTournament, já dentro da transação
// aberta pelo withRls dele — não abre a própria transação. Broadcast e
// notificações ficam de fora do retorno pra quem chamou emitir só depois
// do commit (ver comentário de broadcastBracketUpdated acima).
export async function generateBracket(
  tx: Prisma.TransactionClient,
  tournament: { id: string; name: string },
  registrationIds: string[],
) {
  const tournamentId = tournament.id;
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

  const createdMatches: Match[] = [];

  for (const pair of plan.matchPairs) {
    const match = await matchesRepository.createMatch(tx, {
      tournamentId,
      bracketSlotId: slotIdByRoundPosition.get(`2-${pair.pairIndex}`)!,
      registrationAId: pair.registrationAId,
      registrationBId: pair.registrationBId,
    });
    createdMatches.push(match);
  }

  for (const bye of plan.byes) {
    const nextSlotId = slotIdByRoundPosition.get(`2-${bye.pairIndex}`)!;
    await matchesRepository.updateBracketSlotRegistration(tx, nextSlotId, bye.registrationId);
    const cascadedMatch = await bracketGenerator.maybeCreateNextRoundMatch(
      tx,
      tournamentId,
      2,
      bye.pairIndex,
    );
    if (cascadedMatch) createdMatches.push(cascadedMatch);
  }

  await tournamentsRepository.updateTournamentStatus(tx, tournamentId, 'IN_PROGRESS');

  const notifications = await buildMatchReadyNotifications(tx, tournament, createdMatches);
  const bracket = await matchesRepository.findBracketByTournamentId(tx, tournamentId);
  return { bracket, notifications };
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
  const { updatedMatch, tournamentId, notifications } = await withRls(
    { userId: actor.id, role: actor.role },
    async (tx) => {
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

      const updated = await matchesRepository.updateMatchResult(tx, matchId, {
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
      const nextMatch = await bracketGenerator.maybeCreateNextRoundMatch(
        tx,
        match.tournamentId,
        targetSlot.round,
        targetSlot.position,
      );

      let matchReadyNotifications: Notification[] = [];
      if (nextMatch) {
        // O torneio da partida sempre existe (FK) — não revalidar aqui,
        // computeFinalPlacements/startTournament já garantiram o fluxo.
        const tournament = await tournamentsRepository.findTournamentById(tx, match.tournamentId);
        matchReadyNotifications = await buildMatchReadyNotifications(
          tx,
          { id: tournament!.id, name: tournament!.name },
          [nextMatch],
        );
      }

      return {
        updatedMatch: updated,
        tournamentId: match.tournamentId,
        notifications: matchReadyNotifications,
      };
    },
  );

  // Pós-commit (ver comentário de broadcastBracketUpdated) — corrige um bug
  // latente: antes, o broadcast/emit rodava dentro do withRls, então um
  // cliente podia refetchar o bracket antes do commit terminar e ver
  // estado obsoleto.
  broadcastBracketUpdated(tournamentId);
  emitNewNotifications(notifications);
  return updatedMatch;
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
