import type { Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

export function createXpTransactions(
  tx: Prisma.TransactionClient,
  data: Prisma.XpTransactionCreateManyInput[],
) {
  return tx.xpTransaction.createMany({ data });
}

export async function getXpTotal(tx: Prisma.TransactionClient, userId: string): Promise<number> {
  const result = await tx.xpTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function getXpTotalsByUserIds(
  tx: Prisma.TransactionClient,
  userIds: string[],
): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();
  const grouped = await tx.xpTransaction.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds } },
    _sum: { amount: true },
  });
  return new Map(grouped.map((row) => [row.userId, row._sum.amount ?? 0]));
}

// Usado pelo avaliador de FIRST_WIN em completeTournament — chamado ANTES
// de inserir as XpTransaction desta finalização, então "quantas vitórias
// já existem" já é, por construção, "quantas vitórias PRÉVIAS".
export async function countPriorMatchWinsByUserIds(
  tx: Prisma.TransactionClient,
  userIds: string[],
): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();
  const grouped = await tx.xpTransaction.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds }, type: 'MATCH_WIN' },
    _count: { _all: true },
  });
  return new Map(grouped.map((row) => [row.userId, row._count._all]));
}

export function listXpTransactions(tx: Prisma.TransactionClient, userId: string) {
  return tx.xpTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}
