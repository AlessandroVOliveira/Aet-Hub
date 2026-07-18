import type { Prisma, RedemptionStatus } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

export function createStoreItem(tx: Prisma.TransactionClient, data: Prisma.StoreItemCreateInput) {
  return tx.storeItem.create({ data });
}

export function listActiveStoreItems(tx: Prisma.TransactionClient) {
  return tx.storeItem.findMany({ where: { isActive: true }, orderBy: { costInCoins: 'asc' } });
}

export function listAllStoreItems(tx: Prisma.TransactionClient) {
  return tx.storeItem.findMany({ orderBy: { createdAt: 'desc' } });
}

export function findStoreItemById(tx: Prisma.TransactionClient, id: string) {
  return tx.storeItem.findUnique({ where: { id } });
}

export function updateStoreItem(
  tx: Prisma.TransactionClient,
  id: string,
  data: Prisma.StoreItemUpdateInput,
) {
  return tx.storeItem.update({ where: { id }, data });
}

// Concorrência: UPDATE condicional atômico em vez de "ler estoque, checar
// em JS, decrementar" — count === 0 significa que outra request esgotou o
// item entre a checagem e o INSERT, ou que já estava em 0.
export function decrementStoreItemStock(tx: Prisma.TransactionClient, id: string) {
  return tx.storeItem.updateMany({
    where: { id, stock: { gt: 0 } },
    data: { stock: { decrement: 1 } },
  });
}

export function incrementStoreItemStock(tx: Prisma.TransactionClient, id: string) {
  return tx.storeItem.update({ where: { id }, data: { stock: { increment: 1 } } });
}

const redemptionWithItemInclude = {
  storeItem: { select: { id: true, name: true, imageUrl: true, partnerName: true } },
} satisfies Prisma.RedemptionInclude;

export function createRedemption(
  tx: Prisma.TransactionClient,
  data: { storeItemId: string; userId: string; costInCoins: number },
) {
  return tx.redemption.create({ data, include: redemptionWithItemInclude });
}

export function findRedemptionById(tx: Prisma.TransactionClient, id: string) {
  return tx.redemption.findUnique({ where: { id }, include: redemptionWithItemInclude });
}

export function listMyRedemptions(tx: Prisma.TransactionClient, userId: string) {
  return tx.redemption.findMany({
    where: { userId },
    include: redemptionWithItemInclude,
    orderBy: { redeemedAt: 'desc' },
  });
}

export function listAllRedemptions(tx: Prisma.TransactionClient, status?: RedemptionStatus) {
  return tx.redemption.findMany({
    where: status ? { status } : undefined,
    include: {
      ...redemptionWithItemInclude,
      user: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
    },
    orderBy: { redeemedAt: 'desc' },
  });
}

export function updateRedemptionStatus(
  tx: Prisma.TransactionClient,
  id: string,
  data: { status: RedemptionStatus; fulfilledAt: Date | null },
) {
  return tx.redemption.update({ where: { id }, data, include: redemptionWithItemInclude });
}

// amount é sempre negativo (débito) — a policy de RLS
// points_transactions_self_redemption_insert exige isso quando quem
// insere é o próprio player (ver CLAUDE.md).
export function createRedemptionDebitEntry(
  tx: Prisma.TransactionClient,
  data: { userId: string; amount: number; redemptionId: string; description: string },
) {
  return tx.pointsTransaction.create({ data: { ...data, type: 'REDEMPTION' } });
}

// Estorno de resgate cancelado — sempre disparado por admin, então cai na
// policy points_transactions_admin_insert já existente. Sem redemptionId:
// a coluna é @unique e já foi usada pela linha REDEMPTION original: a
// rastreabilidade do estorno fica só na description.
export function createRedemptionRefundEntry(
  tx: Prisma.TransactionClient,
  data: { userId: string; amount: number; description: string; createdByUserId: string },
) {
  return tx.pointsTransaction.create({ data: { ...data, type: 'ADJUSTMENT' } });
}
