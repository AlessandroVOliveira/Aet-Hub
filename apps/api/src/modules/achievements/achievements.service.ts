import { Prisma } from '@prisma/client';
import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as achievementsRepository from './achievements.repository.js';
import type { CreateAchievementInput, UpdateAchievementInput } from './achievements.schemas.js';

export async function listActiveAchievements(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    achievementsRepository.listActiveAchievements(tx),
  );
}

export async function listAllAchievements(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    achievementsRepository.listAllAchievements(tx),
  );
}

export async function createAchievement(actor: AccessTokenPayload, input: CreateAchievementInput) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    try {
      return await achievementsRepository.createAchievement(tx, input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Já existe uma conquista com esse código', 409);
      }
      throw error;
    }
  });
}

export async function updateAchievement(
  actor: AccessTokenPayload,
  id: string,
  input: UpdateAchievementInput,
) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const existing = await achievementsRepository.findAchievementById(tx, id);
    if (!existing) {
      throw new AppError('Conquista não encontrada', 404);
    }
    return achievementsRepository.updateAchievement(tx, id, input);
  });
}
