import type { BracketType, Match, Notification, Prisma, TiebreakerRule } from '@prisma/client';
import { withRls } from '../../config/rls.js';
import { getSocketServer } from '../../config/socket.js';
import { AppError } from '../../utils/app-error.js';
import { recordAuditLog } from '../../utils/audit-log.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as tournamentsRepository from '../tournaments/tournaments.repository.js';
import * as notificationsRepository from '../notifications/notifications.repository.js';
import { emitNewNotifications } from '../notifications/notifications.emitter.js';
import * as matchesRepository from './matches.repository.js';
import * as bracketGenerator from './bracket-generator.js';
import * as placementCalculator from './placement-calculator.js';
import type { PlacementResult, MatchOutcome } from './placement-calculator.js';
import type { RecordMatchResultInput, CorrectMatchResultInput } from './matches.schemas.js';

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
// do commit (ver comentário de broadcastBracketUpdated acima). Dispatcha
// por bracketType — o resto do módulo (recordMatchResult) faz o mesmo.
export async function generateBracket(
  tx: Prisma.TransactionClient,
  tournament: { id: string; name: string; bracketType: BracketType },
  registrationIds: string[],
) {
  if (tournament.bracketType === 'DOUBLE_ELIMINATION') {
    return generateDoubleEliminationBracket(tx, tournament, registrationIds);
  }
  return generateSingleEliminationBracket(tx, tournament, registrationIds);
}

async function generateSingleEliminationBracket(
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
      const slot = await matchesRepository.createBracketSlot(tx, {
        tournamentId,
        side: 'WINNERS',
        round,
        position,
      });
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

// Cria WB + LB + os dois slots da grande final de uma vez (a LB/GF ficam
// vazias até as partidas reais da WB/LB resolverem — só a rodada 1 da WB é
// semeada imediatamente, mesmo padrão da eliminação simples). Ver
// bracket-generator.ts#computeDoubleEliminationPlan pro cronograma da LB.
async function generateDoubleEliminationBracket(
  tx: Prisma.TransactionClient,
  tournament: { id: string; name: string },
  registrationIds: string[],
) {
  const tournamentId = tournament.id;
  const { wb, wbRounds, lbSchedule } = bracketGenerator.computeDoubleEliminationPlan(registrationIds);

  const wbSlotId = new Map<string, string>();
  for (let round = 1; round <= wb.totalRounds; round++) {
    const slotsInRound = wb.bracketSize / 2 ** (round - 1);
    for (let position = 1; position <= slotsInRound; position++) {
      const slot = await matchesRepository.createBracketSlot(tx, {
        tournamentId,
        side: 'WINNERS',
        round,
        position,
      });
      wbSlotId.set(`${round}-${position}`, slot.id);
    }
  }

  const lbSlotId = new Map<string, string>();
  for (const roundPlan of lbSchedule) {
    for (let position = 1; position <= roundPlan.entering; position++) {
      const slot = await matchesRepository.createBracketSlot(tx, {
        tournamentId,
        side: 'LOSERS',
        round: roundPlan.lbRound,
        position,
      });
      lbSlotId.set(`${roundPlan.lbRound}-${position}`, slot.id);
    }
  }

  await matchesRepository.createBracketSlot(tx, {
    tournamentId,
    side: 'GRAND_FINAL',
    round: 1,
    position: 1,
  });
  await matchesRepository.createBracketSlot(tx, {
    tournamentId,
    side: 'GRAND_FINAL',
    round: 2,
    position: 1,
  });

  for (const seat of wb.round1Seats) {
    if (seat.registrationId) {
      await matchesRepository.updateBracketSlotRegistration(
        tx,
        wbSlotId.get(`1-${seat.position}`)!,
        seat.registrationId,
      );
    }
  }

  const createdMatches: Match[] = [];
  const entryRoundPlan = lbSchedule[0]!;

  for (const pair of wb.matchPairs) {
    const lbPosition = entryRoundPlan.wbLoserPosition!.get(pair.pairIndex)!;
    const match = await matchesRepository.createMatch(tx, {
      tournamentId,
      bracketSlotId: wbSlotId.get(`2-${pair.pairIndex}`)!,
      registrationAId: pair.registrationAId,
      registrationBId: pair.registrationBId,
      loserBracketSlotId: lbSlotId.get(`1-${lbPosition}`)!,
    });
    createdMatches.push(match);
  }

  for (const bye of wb.byes) {
    const nextSlotId = wbSlotId.get(`2-${bye.pairIndex}`)!;
    await matchesRepository.updateBracketSlotRegistration(tx, nextSlotId, bye.registrationId);
    const cascadedMatch = await bracketGenerator.maybeCreateNextRoundMatch(
      tx,
      tournamentId,
      2,
      bye.pairIndex,
    );
    if (cascadedMatch) {
      createdMatches.push(cascadedMatch);
      const cascadedSlot = await matchesRepository.findBracketSlotById(tx, cascadedMatch.bracketSlotId);
      await bracketGenerator.wireWbLoserDestination(
        tx,
        tournamentId,
        wbRounds,
        cascadedMatch.id,
        cascadedSlot.round - 1,
        cascadedSlot.position,
      );
    }
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

      // O torneio da partida sempre existe (FK) — não revalidar aqui,
      // computeFinalPlacements/startTournament já garantiram o fluxo.
      const tournament = await tournamentsRepository.findTournamentById(tx, match.tournamentId);

      const targetSlot = await matchesRepository.findBracketSlotById(tx, match.bracketSlotId);
      await matchesRepository.updateBracketSlotRegistration(
        tx,
        match.bracketSlotId,
        input.winnerRegistrationId,
      );

      let nextMatch: Match | null = null;
      if (tournament!.bracketType === 'SINGLE_ELIMINATION') {
        nextMatch = await bracketGenerator.maybeCreateNextRoundMatch(
          tx,
          match.tournamentId,
          targetSlot.round,
          targetSlot.position,
        );
      } else if (targetSlot.side === 'WINNERS') {
        // Eliminação dupla — vencedor avança na WB (mecanismo genérico,
        // idêntico ao de eliminação simples) e o perdedor é roteado pra LB.
        nextMatch = await bracketGenerator.maybeCreateNextRoundMatch(
          tx,
          match.tournamentId,
          targetSlot.round,
          targetSlot.position,
        );
        if (nextMatch) {
          const nextSlot = await matchesRepository.findBracketSlotById(tx, nextMatch.bracketSlotId);
          const wbRounds = await bracketGenerator.computeWbRounds(tx, match.tournamentId);
          await bracketGenerator.wireWbLoserDestination(
            tx,
            match.tournamentId,
            wbRounds,
            nextMatch.id,
            nextSlot.round - 1,
            nextSlot.position,
          );
        }
        const loserRegistrationId =
          input.winnerRegistrationId === match.registrationAId
            ? match.registrationBId!
            : match.registrationAId!;
        await bracketGenerator.maybeRouteLoserToLosersBracket(
          tx,
          match.tournamentId,
          match,
          loserRegistrationId,
        );
        const grandFinal = await bracketGenerator.maybeCreateGrandFinal(tx, match.tournamentId);
        if (grandFinal) nextMatch = grandFinal;
      } else if (targetSlot.side === 'LOSERS') {
        nextMatch = await bracketGenerator.checkLosersBracketAdvancement(
          tx,
          match.tournamentId,
          targetSlot.round,
          targetSlot.position,
        );
        const grandFinal = await bracketGenerator.maybeCreateGrandFinal(tx, match.tournamentId);
        if (grandFinal) nextMatch = grandFinal;
      } else if (targetSlot.side === 'GRAND_FINAL' && targetSlot.round === 1) {
        // RF reset de chave — só cria a 2ª partida se quem veio da LB
        // venceu a 1ª (ver bracket-generator.ts#maybeCreateGrandFinalReset).
        nextMatch = await bracketGenerator.maybeCreateGrandFinalReset(
          tx,
          match.tournamentId,
          match,
          input.winnerRegistrationId,
        );
      }
      // targetSlot.side === 'GRAND_FINAL' && round === 2 (reset já jogado)
      // é sempre terminal — nada mais a avançar.

      let matchReadyNotifications: Notification[] = [];
      if (nextMatch) {
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

// RF-19: corrige o resultado de uma partida já COMPLETED. Só permitido
// enquanto o torneio está IN_PROGRESS (pontos/finalPlacement só existem a
// partir de completeTournament, calculados uma única vez — corrigir depois
// disso exigiria reverter ledger/colocação, fora de escopo desta fatia).
// Cascata limitada a 1 nível: se o vencedor já avançou e a partida
// seguinte já foi disputada, rejeita — o admin precisa corrigir a
// seguinte primeiro.
export async function correctMatchResult(
  actor: AccessTokenPayload,
  matchId: string,
  input: CorrectMatchResultInput,
) {
  const { updatedMatch, tournamentId } = await withRls(
    { userId: actor.id, role: actor.role },
    async (tx) => {
      const match = await matchesRepository.findMatchById(tx, matchId);
      if (!match) {
        throw new AppError('Partida não encontrada', 404);
      }
      if (match.status !== 'COMPLETED') {
        throw new AppError(
          'Esta partida ainda não tem resultado registrado — use o registro normal',
          400,
        );
      }

      const tournament = await tournamentsRepository.findTournamentById(tx, match.tournamentId);
      if (!tournament || tournament.status !== 'IN_PROGRESS') {
        throw new AppError(
          'Só é possível corrigir o resultado enquanto o torneio está em andamento',
          409,
        );
      }
      if (tournament.bracketType !== 'SINGLE_ELIMINATION') {
        throw new AppError(
          'Corrigir resultado em torneios de eliminação dupla ainda não é suportado',
          409,
        );
      }

      if (
        input.winnerRegistrationId !== match.registrationAId &&
        input.winnerRegistrationId !== match.registrationBId
      ) {
        throw new AppError('Vencedor informado não participa desta partida', 400);
      }

      // Mesma matemática de bracket-generator.ts#maybeCreateNextRoundMatch,
      // pra localizar com precisão a partida seguinte (se existir) sem
      // buscar por registrationId (ambíguo — o mesmo jogador aparece em
      // registrationAId/BId de partidas anteriores também).
      const targetSlot = await matchesRepository.findBracketSlotById(tx, match.bracketSlotId);
      const nextPosition = Math.ceil(targetSlot.position / 2);
      const nextSlot = await matchesRepository.findBracketSlotByPosition(
        tx,
        match.tournamentId,
        'WINNERS',
        targetSlot.round + 1,
        nextPosition,
      );
      const downstreamMatch = nextSlot
        ? await matchesRepository.findMatchByBracketSlotId(tx, nextSlot.id)
        : null;

      if (downstreamMatch && downstreamMatch.status !== 'SCHEDULED') {
        throw new AppError(
          'O vencedor desta partida já disputou a partida seguinte — corrija primeiro o resultado dela',
          409,
        );
      }

      const updated = await matchesRepository.correctMatchResult(tx, matchId, {
        winnerRegistrationId: input.winnerRegistrationId,
        scoreA: input.scoreA,
        scoreB: input.scoreB,
      });

      await matchesRepository.updateBracketSlotRegistration(
        tx,
        targetSlot.id,
        input.winnerRegistrationId,
      );

      if (downstreamMatch) {
        const side = targetSlot.position % 2 === 1 ? 'A' : 'B';
        await matchesRepository.updateMatchParticipant(
          tx,
          downstreamMatch.id,
          side,
          input.winnerRegistrationId,
        );
      }

      await recordAuditLog(tx, {
        actorUserId: actor.id,
        action: 'MATCH_RESULT_CORRECTED',
        entityType: 'MATCH',
        entityId: matchId,
        metadata: {
          reason: input.reason,
          previousWinnerRegistrationId: match.winnerRegistrationId,
          previousScoreA: match.scoreA,
          previousScoreB: match.scoreB,
          newWinnerRegistrationId: input.winnerRegistrationId,
          newScoreA: input.scoreA ?? null,
          newScoreB: input.scoreB ?? null,
        },
      });

      return { updatedMatch: updated, tournamentId: match.tournamentId };
    },
  );

  broadcastBracketUpdated(tournamentId);
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
  tiebreakerRule?: TiebreakerRule | null,
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
    placements: placementCalculator.computePlacements(matchOutcomes, tiebreakerRule),
    matchOutcomes,
  };
}
