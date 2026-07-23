import type { Prisma } from '@prisma/client';
import { withRls } from '../../config/rls.js';
import { getSocketServer } from '../../config/socket.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as matchesRepository from '../matches/matches.repository.js';
import * as matchesService from '../matches/matches.service.js';
import * as notificationsRepository from '../notifications/notifications.repository.js';
import { emitNewNotifications } from '../notifications/notifications.emitter.js';
import * as tournamentsRepository from './tournaments.repository.js';
import type { CreateTournamentInput, UpdateTournamentInput } from './tournaments.schemas.js';

export async function createTournament(actor: AccessTokenPayload, input: CreateTournamentInput) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const game = await tournamentsRepository.findGameById(tx, input.gameId);
    if (!game) {
      throw new AppError('Jogo não encontrado', 404);
    }

    return tournamentsRepository.createTournament(tx, { ...input, createdByUserId: actor.id });
  });
}

export async function listTournaments(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    tournamentsRepository.listTournaments(tx),
  );
}

export async function getTournamentById(actor: AccessTokenPayload, id: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const tournament = await tournamentsRepository.findTournamentById(tx, id);
    if (!tournament) {
      throw new AppError('Torneio não encontrado', 404);
    }
    return tournament;
  });
}

export async function updateTournament(
  actor: AccessTokenPayload,
  id: string,
  input: UpdateTournamentInput,
) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const existing = await tournamentsRepository.findTournamentById(tx, id);
    if (!existing) {
      throw new AppError('Torneio não encontrado', 404);
    }

    const game = await tournamentsRepository.findGameById(tx, input.gameId);
    if (!game) {
      throw new AppError('Jogo não encontrado', 404);
    }

    return tournamentsRepository.replaceTournament(tx, id, {
      ...input,
      status: input.status ?? existing.status,
    });
  });
}

export async function deleteTournament(actor: AccessTokenPayload, id: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const existing = await tournamentsRepository.findTournamentById(tx, id);
    if (!existing) {
      throw new AppError('Torneio não encontrado', 404);
    }

    if (existing.status !== 'DRAFT') {
      throw new AppError(
        'Só é possível excluir torneios em rascunho; cancelamento de torneios em andamento será tratado em uma fatia futura',
        409,
      );
    }

    await tournamentsRepository.deleteTournament(tx, id);
  });
}

const NON_STARTABLE_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export async function startTournament(actor: AccessTokenPayload, id: string) {
  const { bracket, notifications } = await withRls(
    { userId: actor.id, role: actor.role },
    async (tx) => {
      const tournament = await tournamentsRepository.findTournamentById(tx, id);
      if (!tournament) {
        throw new AppError('Torneio não encontrado', 404);
      }

      if (tournament.bracketType !== 'SINGLE_ELIMINATION') {
        throw new AppError(
          'Só é possível iniciar torneios de eliminação simples nesta versão',
          409,
        );
      }

      if (NON_STARTABLE_STATUSES.includes(tournament.status)) {
        throw new AppError('Torneio já foi iniciado ou encerrado', 409);
      }

      if (await matchesRepository.hasAnyBracketSlot(tx, id)) {
        throw new AppError('Torneio já foi iniciado ou encerrado', 409);
      }

      const confirmed = await tournamentsRepository.findConfirmedCheckedInRegistrations(tx, id);
      if (confirmed.length < 2) {
        throw new AppError('Não há inscritos suficientes', 409);
      }

      return matchesService.generateBracket(
        tx,
        { id: tournament.id, name: tournament.name },
        confirmed.map((registration) => registration.id),
      );
    },
  );

  // Pós-commit — ver comentário de matchesService.broadcastBracketUpdated.
  matchesService.broadcastBracketUpdated(id);
  emitNewNotifications(notifications);
  return bracket;
}

function broadcastTournamentCompleted(tournamentId: string): void {
  const io = getSocketServer();
  if (!io) return; // best-effort — scripts fora do server HTTP não têm socket
  io.of('/tournaments')
    .to(`tournament:${tournamentId}`)
    .emit('tournament:completed', { tournamentId });
}

interface TournamentForPointsCalculation {
  id: string;
  name: string;
  pointsPerWin: number;
  pointsPerLoss: number;
  placementRewards: { placement: number; bonusPoints: number }[];
}

// pointsPerLoss pode ser 0 — a linha MATCH_LOSS é gerada mesmo assim
// (ledger append-only e auditável, RNF-08 pede reconstruir o saldo a
// qualquer momento; um amount: 0 não distorce saldo nenhum, só documenta
// que a derrota foi contabilizada).
function buildPointsTransactionEntries(params: {
  tournament: TournamentForPointsCalculation;
  matchOutcomes: {
    matchId: string;
    registrationAId: string;
    registrationBId: string;
    winnerRegistrationId: string;
  }[];
  placements: { registrationId: string; placement: number }[];
  userIdByRegistrationId: Map<string, string>;
  createdByUserId: string;
}): Prisma.PointsTransactionCreateManyInput[] {
  const { tournament, matchOutcomes, placements, userIdByRegistrationId, createdByUserId } = params;
  const entries: Prisma.PointsTransactionCreateManyInput[] = [];

  for (const outcome of matchOutcomes) {
    const loserRegistrationId =
      outcome.winnerRegistrationId === outcome.registrationAId
        ? outcome.registrationBId
        : outcome.registrationAId;

    entries.push({
      userId: userIdByRegistrationId.get(outcome.winnerRegistrationId)!,
      type: 'MATCH_WIN',
      amount: tournament.pointsPerWin,
      tournamentId: tournament.id,
      matchId: outcome.matchId,
      description: `Vitória em partida do torneio ${tournament.name}`,
      createdByUserId,
    });
    entries.push({
      userId: userIdByRegistrationId.get(loserRegistrationId)!,
      type: 'MATCH_LOSS',
      amount: tournament.pointsPerLoss,
      tournamentId: tournament.id,
      matchId: outcome.matchId,
      description: `Derrota em partida do torneio ${tournament.name}`,
      createdByUserId,
    });
  }

  const rewardByPlacement = new Map(
    tournament.placementRewards.map((reward) => [reward.placement, reward]),
  );
  for (const { registrationId, placement } of placements) {
    const reward = rewardByPlacement.get(placement);
    if (!reward || reward.bonusPoints <= 0) continue;
    entries.push({
      userId: userIdByRegistrationId.get(registrationId)!,
      type: 'PLACEMENT',
      amount: reward.bonusPoints,
      tournamentId: tournament.id,
      matchId: null,
      description: `${placement}º lugar no torneio ${tournament.name}`,
      createdByUserId,
    });
  }

  return entries;
}

export async function completeTournament(actor: AccessTokenPayload, id: string) {
  const { tournament: completed, finalStandings, notifications } = await withRls(
    { userId: actor.id, role: actor.role },
    async (tx) => {
      const tournament = await tournamentsRepository.findTournamentById(tx, id);
      if (!tournament) {
        throw new AppError('Torneio não encontrado', 404);
      }
      if (tournament.status !== 'IN_PROGRESS') {
        throw new AppError('Só é possível encerrar torneios em andamento', 409);
      }

      const { placements, matchOutcomes } = await matchesService.computeFinalPlacements(tx, id);
      const registrations = await tournamentsRepository.findRegistrationUserIds(tx, id);
      const userIdByRegistrationId = new Map(
        registrations.map((registration) => [registration.id, registration.userId]),
      );

      await tournamentsRepository.applyFinalPlacements(tx, placements);

      const pointsEntries = buildPointsTransactionEntries({
        tournament,
        matchOutcomes,
        placements,
        userIdByRegistrationId,
        createdByUserId: actor.id,
      });
      if (pointsEntries.length > 0) {
        await tournamentsRepository.createPointsTransactions(tx, pointsEntries);
      }

      const updated = await tournamentsRepository.updateTournamentStatus(tx, id, 'COMPLETED');
      const standings = await tournamentsRepository.findRegistrationsWithFinalPlacement(tx, id);

      // Soma dos pontos ganhos NESTA finalização (vitórias/derrotas +
      // bônus de colocação), por userId — só para compor o texto da
      // notificação, não é o saldo total do usuário.
      const pointsByUserId = new Map<string, number>();
      for (const entry of pointsEntries) {
        pointsByUserId.set(entry.userId, (pointsByUserId.get(entry.userId) ?? 0) + entry.amount);
      }

      const tournamentNotifications = [];
      for (const { registrationId, placement } of placements) {
        const userId = userIdByRegistrationId.get(registrationId)!;
        const points = pointsByUserId.get(userId) ?? 0;
        const body =
          points > 0
            ? `${tournament.name}: você terminou em ${placement}º lugar e ganhou ${points} pontos`
            : `${tournament.name}: você terminou em ${placement}º lugar`;

        tournamentNotifications.push(
          await notificationsRepository.createNotification(tx, {
            userId,
            type: 'TOURNAMENT_COMPLETED',
            title: 'Torneio encerrado',
            body,
            linkPath: `/torneios/${id}/chaveamento`,
            refId: id,
          }),
        );
      }

      return { tournament: updated, finalStandings: standings, notifications: tournamentNotifications };
    },
  );

  // Pós-commit (ver comentário de matchesService.broadcastBracketUpdated) —
  // move broadcastTournamentCompleted pra fora do withRls pelo mesmo
  // motivo do bracket: emitir antes do commit podia refetchar estado que
  // ainda sofria rollback.
  broadcastTournamentCompleted(id);
  emitNewNotifications(notifications);
  return { tournament: completed, finalStandings };
}
