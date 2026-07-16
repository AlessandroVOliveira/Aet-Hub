import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as tournamentsRepository from '../tournaments/tournaments.repository.js';
import * as registrationsRepository from './registrations.repository.js';
import type { CreateRegistrationInput } from './registrations.schemas.js';

export async function listOpenTournaments(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    tournamentsRepository.listOpenTournamentsForRegistration(tx),
  );
}

export async function listMyRegistrations(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    registrationsRepository.listMyRegistrations(tx, actor.id),
  );
}

export async function registerForTournament(actor: AccessTokenPayload, input: CreateRegistrationInput) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const tournament = await tournamentsRepository.findTournamentById(tx, input.tournamentId);
    if (!tournament) {
      throw new AppError('Torneio não encontrado', 404);
    }

    const now = new Date();
    const withinWindow =
      tournament.status === 'REGISTRATION_OPEN' &&
      now >= tournament.registrationStartAt &&
      now <= tournament.registrationEndAt;
    if (!withinWindow) {
      throw new AppError('Inscrições não estão abertas para este torneio', 409);
    }

    const existing = await registrationsRepository.findRegistrationByCompositeKey(
      tx,
      input.tournamentId,
      actor.id,
    );

    if (existing && existing.status !== 'CANCELLED') {
      throw new AppError('Você já está inscrito neste torneio', 409);
    }

    try {
      if (existing) {
        return await registrationsRepository.reactivateRegistration(tx, existing.id, randomUUID());
      }
      return await registrationsRepository.createRegistration(tx, {
        tournamentId: input.tournamentId,
        userId: actor.id,
        qrCodeToken: randomUUID(),
      });
    } catch (error) {
      // Defesa contra corrida entre o check de duplicidade acima e o
      // INSERT, igual ao padrão já usado em auth.service.ts.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Você já está inscrito neste torneio', 409);
      }
      throw error;
    }
  });
}

export async function cancelRegistration(actor: AccessTokenPayload, tournamentId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const tournament = await tournamentsRepository.findTournamentById(tx, tournamentId);
    if (!tournament) {
      throw new AppError('Torneio não encontrado', 404);
    }

    const registration = await registrationsRepository.findRegistrationByCompositeKey(
      tx,
      tournamentId,
      actor.id,
    );
    if (!registration || registration.status !== 'CONFIRMED') {
      throw new AppError('Você não tem inscrição ativa neste torneio', 404);
    }

    if (new Date() > tournament.checkinDeadlineAt) {
      throw new AppError('Prazo para cancelar a inscrição já passou', 409);
    }

    return registrationsRepository.cancelRegistration(tx, registration.id);
  });
}
