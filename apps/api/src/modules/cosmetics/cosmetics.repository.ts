import type { CosmeticKind, Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

export function listActiveCosmetics(tx: Prisma.TransactionClient, kind?: CosmeticKind) {
  return tx.cosmeticItem.findMany({
    where: { isActive: true, ...(kind ? { kind } : {}) },
    orderBy: [{ kind: 'asc' }, { priceInPoints: 'asc' }],
  });
}

export function listAllCosmetics(tx: Prisma.TransactionClient) {
  return tx.cosmeticItem.findMany({ orderBy: [{ kind: 'asc' }, { createdAt: 'desc' }] });
}

export function findCosmeticItemById(tx: Prisma.TransactionClient, id: string) {
  return tx.cosmeticItem.findUnique({ where: { id } });
}

// Usado pelo perfil público (users.repository) pra resolver o loadout
// equipado de um terceiro contra o catálogo — sem RLS pra se preocupar,
// cosmetic_items é catálogo público autenticado.
export function findCosmeticItemsByIds(tx: Prisma.TransactionClient, ids: string[]) {
  if (ids.length === 0) return Promise.resolve([]);
  return tx.cosmeticItem.findMany({ where: { id: { in: ids } } });
}

export function createCosmeticItem(
  tx: Prisma.TransactionClient,
  data: Prisma.CosmeticItemCreateInput,
) {
  return tx.cosmeticItem.create({ data });
}

export function updateCosmeticItem(
  tx: Prisma.TransactionClient,
  id: string,
  data: Prisma.CosmeticItemUpdateInput,
) {
  return tx.cosmeticItem.update({ where: { id }, data });
}

export async function findOwnedCosmeticItemIds(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<Set<string>> {
  const rows = await tx.userCosmeticItem.findMany({
    where: { userId },
    select: { cosmeticItemId: true },
  });
  return new Set(rows.map((row) => row.cosmeticItemId));
}

export function findUserCosmeticItem(
  tx: Prisma.TransactionClient,
  userId: string,
  cosmeticItemId: string,
) {
  return tx.userCosmeticItem.findUnique({
    where: { userId_cosmeticItemId: { userId, cosmeticItemId } },
  });
}

export function createUserCosmeticItem(
  tx: Prisma.TransactionClient,
  data: { userId: string; cosmeticItemId: string },
) {
  return tx.userCosmeticItem.create({ data });
}

// amount é sempre negativo (débito) — a policy de RLS
// points_transactions_self_cosmetic_purchase_insert exige isso quando quem
// insere é o próprio player (mesmo padrão de
// store.repository#createRedemptionDebitEntry).
export function createCosmeticPurchaseDebitEntry(
  tx: Prisma.TransactionClient,
  data: { userId: string; amount: number; userCosmeticItemId: string; description: string },
) {
  return tx.pointsTransaction.create({ data: { ...data, type: 'COSMETIC_PURCHASE' } });
}
