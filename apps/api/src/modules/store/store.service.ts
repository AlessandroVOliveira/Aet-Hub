import type { RedemptionStatus } from '@prisma/client';
import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as usersRepository from '../users/users.repository.js';
import * as storeRepository from './store.repository.js';
import type {
  CreateStoreItemInput,
  RedeemStoreItemInput,
  UpdateRedemptionStatusInput,
  UpdateStoreItemInput,
} from './store.schemas.js';

export async function createStoreItem(actor: AccessTokenPayload, input: CreateStoreItemInput) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    storeRepository.createStoreItem(tx, input),
  );
}

export async function listActiveStoreItems(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    storeRepository.listActiveStoreItems(tx),
  );
}

export async function listAllStoreItems(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    storeRepository.listAllStoreItems(tx),
  );
}

export async function updateStoreItem(
  actor: AccessTokenPayload,
  id: string,
  input: UpdateStoreItemInput,
) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const existing = await storeRepository.findStoreItemById(tx, id);
    if (!existing) {
      throw new AppError('Item não encontrado', 404);
    }
    return storeRepository.updateStoreItem(tx, id, input);
  });
}

export async function redeemStoreItem(actor: AccessTokenPayload, input: RedeemStoreItemInput) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    // Serializa resgates concorrentes do MESMO usuário — evita corrida entre
    // a leitura de saldo (SUM agregado, não uma linha travável por WHERE) e
    // o INSERT do débito. Lock transacional: liberado sozinho no fim da tx.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('redemption:' || ${actor.id}))`;

    const item = await storeRepository.findStoreItemById(tx, input.storeItemId);
    if (!item || !item.isActive) {
      throw new AppError('Item não encontrado', 404);
    }

    const balance = await usersRepository.getPointsBalance(tx, actor.id);
    if (balance < item.costInCoins) {
      throw new AppError('Saldo de moedas insuficiente', 409);
    }

    if (item.stock !== null) {
      const { count } = await storeRepository.decrementStoreItemStock(tx, item.id);
      if (count === 0) {
        throw new AppError('Item sem estoque disponível', 409);
      }
    }

    const redemption = await storeRepository.createRedemption(tx, {
      storeItemId: item.id,
      userId: actor.id,
      costInCoins: item.costInCoins,
    });

    await storeRepository.createRedemptionDebitEntry(tx, {
      userId: actor.id,
      amount: -item.costInCoins,
      redemptionId: redemption.id,
      description: `Resgate: ${item.name}`,
    });

    return redemption;
  });
}

export async function listMyRedemptions(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    storeRepository.listMyRedemptions(tx, actor.id),
  );
}

export async function listAllRedemptions(actor: AccessTokenPayload, status?: RedemptionStatus) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    storeRepository.listAllRedemptions(tx, status),
  );
}

export async function updateRedemptionStatus(
  actor: AccessTokenPayload,
  redemptionId: string,
  input: UpdateRedemptionStatusInput,
) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const redemption = await storeRepository.findRedemptionById(tx, redemptionId);
    if (!redemption) {
      throw new AppError('Resgate não encontrado', 404);
    }
    if (redemption.status !== 'PENDING') {
      throw new AppError('Este resgate já foi processado', 409);
    }

    const updated = await storeRepository.updateRedemptionStatus(tx, redemptionId, {
      status: input.status,
      fulfilledAt: input.status === 'FULFILLED' ? new Date() : null,
    });

    if (input.status === 'CANCELLED') {
      await storeRepository.createRedemptionRefundEntry(tx, {
        userId: redemption.userId,
        amount: redemption.costInCoins,
        description: `Estorno do resgate cancelado: ${redemption.storeItem.name}`,
        createdByUserId: actor.id,
      });

      const item = await storeRepository.findStoreItemById(tx, redemption.storeItemId);
      if (item !== null && item.stock !== null) {
        await storeRepository.incrementStoreItemStock(tx, item.id);
      }
    }

    return updated;
  });
}
