import { Prisma } from '@prisma/client';
import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as gamesRepository from './games.repository.js';
import type { CreateGameInput, UpdateGameInput } from './games.schemas.js';

// Slug é derivado do nome no servidor (não é um campo do formulário) — é só
// um identificador legado usado hoje como sigla de fallback em Comunidades;
// gerar automaticamente evita duas fontes de verdade pro mesmo nome e poupa
// o admin de pensar em mais um campo pra cadastrar um jogo novo (RF: campo
// Jogo do torneio precisava parar de depender de editar o código/seed pra
// crescer a lista).
function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function listActiveGames(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    gamesRepository.listActiveGames(tx),
  );
}

export async function listAllGames(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) => gamesRepository.listAllGames(tx));
}

export async function createGame(actor: AccessTokenPayload, input: CreateGameInput) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    try {
      return await gamesRepository.createGame(tx, {
        name: input.name,
        slug: slugify(input.name),
        isActive: input.isActive,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Já existe um jogo com esse nome', 409);
      }
      throw error;
    }
  });
}

export async function updateGame(actor: AccessTokenPayload, id: string, input: UpdateGameInput) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const existing = await gamesRepository.findGameById(tx, id);
    if (!existing) {
      throw new AppError('Jogo não encontrado', 404);
    }

    try {
      return await gamesRepository.updateGame(tx, id, {
        ...(input.name !== undefined ? { name: input.name, slug: slugify(input.name) } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Já existe um jogo com esse nome', 409);
      }
      throw error;
    }
  });
}
