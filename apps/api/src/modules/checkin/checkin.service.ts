import { Prisma } from '@prisma/client';
import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as tournamentsRepository from '../tournaments/tournaments.repository.js';
import * as checkinRepository from './checkin.repository.js';
import type { CreateCheckinInput } from './checkin.schemas.js';

export async function checkinRegistration(actor: AccessTokenPayload, input: CreateCheckinInput) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const registration = await checkinRepository.findRegistrationByToken(tx, input.qrCodeToken);
    if (!registration) {
      throw new AppError('Código de checkin inválido', 404);
    }
    if (registration.status !== 'CONFIRMED') {
      throw new AppError('Inscrição não está confirmada', 409);
    }
    if (registration.checkin) {
      throw new AppError('Checkin já realizado para esta inscrição', 409);
    }
    if (new Date() > registration.tournament.checkinDeadlineAt) {
      throw new AppError('Prazo de checkin encerrado', 409);
    }

    try {
      return await checkinRepository.createCheckin(tx, {
        registrationId: registration.id,
        method: input.method,
        checkedInByUserId: actor.id,
      });
    } catch (error) {
      // Defesa contra corrida entre o check acima e o INSERT — checkin é
      // 1:1 com registration (registrationId é @unique no schema).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Checkin já realizado para esta inscrição', 409);
      }
      throw error;
    }
  });
}

export async function listTournamentCheckins(actor: AccessTokenPayload, tournamentId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const tournament = await tournamentsRepository.findTournamentById(tx, tournamentId);
    if (!tournament) {
      throw new AppError('Torneio não encontrado', 404);
    }
    return checkinRepository.listRegistrationsByTournament(tx, tournamentId);
  });
}
