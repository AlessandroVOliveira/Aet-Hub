import { Prisma, type CosmeticKind } from '@prisma/client';
import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as achievementsRepository from '../achievements/achievements.repository.js';
import * as usersRepository from '../users/users.repository.js';
import * as cosmeticsRepository from './cosmetics.repository.js';
import { annotateCosmeticOwnership, isCosmeticOwned } from './cosmetics-ownership.js';
import type {
  CreateCosmeticItemInput,
  PurchaseCosmeticItemInput,
  UpdateCosmeticItemInput,
  UpdateLoadoutInput,
} from './cosmetics.schemas.js';

export async function listCosmetics(actor: AccessTokenPayload, kind?: CosmeticKind) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const [items, unlockedCodes, ownedIds, profile] = await Promise.all([
      cosmeticsRepository.listActiveCosmetics(tx, kind),
      achievementsRepository.findUnlockedAchievementCodes(tx, actor.id),
      cosmeticsRepository.findOwnedCosmeticItemIds(tx, actor.id),
      usersRepository.findProfileByUserId(tx, actor.id),
    ]);

    return {
      items: annotateCosmeticOwnership(items, unlockedCodes, ownedIds),
      loadout: {
        frameId: profile?.equippedFrameId ?? null,
        titleId: profile?.equippedTitleId ?? null,
        fontId: profile?.equippedFontId ?? null,
        mascotId: profile?.equippedMascotId ?? null,
      },
    };
  });
}

export async function listAllCosmetics(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    cosmeticsRepository.listAllCosmetics(tx),
  );
}

export async function createCosmeticItem(actor: AccessTokenPayload, input: CreateCosmeticItemInput) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    try {
      return await cosmeticsRepository.createCosmeticItem(tx, input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Já existe um cosmético com esse nome nesta categoria', 409);
      }
      throw error;
    }
  });
}

export async function updateCosmeticItem(
  actor: AccessTokenPayload,
  id: string,
  input: UpdateCosmeticItemInput,
) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const existing = await cosmeticsRepository.findCosmeticItemById(tx, id);
    if (!existing) {
      throw new AppError('Item não encontrado', 404);
    }

    try {
      return await cosmeticsRepository.updateCosmeticItem(tx, id, input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Já existe um cosmético com esse nome nesta categoria', 409);
      }
      throw error;
    }
  });
}

// Clona o fluxo de store.service.ts#redeemStoreItem: mesmo lock advisory
// (namespace próprio pra não serializar à toa contra resgates da loja),
// mesma ordem de checagens (item existe/ativo -> saldo -> débito).
export async function purchaseCosmeticItem(
  actor: AccessTokenPayload,
  input: PurchaseCosmeticItemInput,
) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('cosmetic_purchase:' || ${actor.id}))`;

    const item = await cosmeticsRepository.findCosmeticItemById(tx, input.cosmeticItemId);
    if (!item || !item.isActive) {
      throw new AppError('Item não encontrado', 404);
    }
    // Item grátis padrão ou só destravável por conquista nunca passa por
    // aqui — a RLS já barra isso (price_in_points > 0), mas checar antes
    // devolve uma mensagem legível em vez de um 403 genérico do Postgres.
    if (item.priceInPoints <= 0) {
      throw new AppError('Este item não é comprável com pontos', 409);
    }

    const existingOwnership = await cosmeticsRepository.findUserCosmeticItem(
      tx,
      actor.id,
      item.id,
    );
    if (existingOwnership) {
      throw new AppError('Você já possui este item', 409);
    }

    const balance = await usersRepository.getPointsBalance(tx, actor.id);
    if (balance < item.priceInPoints) {
      throw new AppError('Saldo de pontos insuficiente', 409);
    }

    const ownership = await cosmeticsRepository.createUserCosmeticItem(tx, {
      userId: actor.id,
      cosmeticItemId: item.id,
    });

    await cosmeticsRepository.createCosmeticPurchaseDebitEntry(tx, {
      userId: actor.id,
      amount: -item.priceInPoints,
      userCosmeticItemId: ownership.id,
      description: `Compra de cosmético: ${item.name}`,
    });

    return ownership;
  });
}

async function resolveLoadoutSlot(
  tx: Prisma.TransactionClient,
  id: string | null | undefined,
  kind: CosmeticKind,
  unlockedCodes: Set<string>,
  ownedIds: Set<string>,
): Promise<string | null | undefined> {
  if (id === undefined) return undefined;
  if (id === null) return null;

  const item = await cosmeticsRepository.findCosmeticItemById(tx, id);
  if (!item || !item.isActive || item.kind !== kind) {
    throw new AppError('Cosmético não encontrado', 404);
  }
  if (!isCosmeticOwned(item, unlockedCodes, ownedIds)) {
    throw new AppError('Você ainda não possui este cosmético', 403);
  }
  return id;
}

// Equipar é grátis/instantâneo — só valida existência, ativo, kind
// correspondente ao slot e posse (própria/comprada/conquista). null
// explícito desequipa; campo ausente deixa o slot como está (mesma
// convenção condicional de updateMyProfile/updateUserByAdmin).
export async function updateLoadout(actor: AccessTokenPayload, input: UpdateLoadoutInput) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const [unlockedCodes, ownedIds] = await Promise.all([
      achievementsRepository.findUnlockedAchievementCodes(tx, actor.id),
      cosmeticsRepository.findOwnedCosmeticItemIds(tx, actor.id),
    ]);

    const [frameId, titleId, fontId, mascotId] = await Promise.all([
      resolveLoadoutSlot(tx, input.frameId, 'FRAME', unlockedCodes, ownedIds),
      resolveLoadoutSlot(tx, input.titleId, 'TITLE', unlockedCodes, ownedIds),
      resolveLoadoutSlot(tx, input.fontId, 'FONT', unlockedCodes, ownedIds),
      resolveLoadoutSlot(tx, input.mascotId, 'MASCOT', unlockedCodes, ownedIds),
    ]);

    return usersRepository.updateProfile(tx, actor.id, {
      ...(frameId !== undefined ? { equippedFrameId: frameId } : {}),
      ...(titleId !== undefined ? { equippedTitleId: titleId } : {}),
      ...(fontId !== undefined ? { equippedFontId: fontId } : {}),
      ...(mascotId !== undefined ? { equippedMascotId: mascotId } : {}),
    });
  });
}
