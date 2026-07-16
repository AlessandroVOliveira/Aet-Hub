import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as matchesRepository from '../matches/matches.repository.js';
import * as matchesService from '../matches/matches.service.js';
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
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const tournament = await tournamentsRepository.findTournamentById(tx, id);
    if (!tournament) {
      throw new AppError('Torneio não encontrado', 404);
    }

    if (tournament.bracketType !== 'SINGLE_ELIMINATION') {
      throw new AppError('Só é possível iniciar torneios de eliminação simples nesta versão', 409);
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
      id,
      confirmed.map((registration) => registration.id),
    );
  });
}
