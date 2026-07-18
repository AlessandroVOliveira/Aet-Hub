import type { Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

const profileDetailInclude = {
  favoriteGame: { select: { id: true, name: true, slug: true } },
  user: { select: { id: true, username: true, email: true } },
} satisfies Prisma.ProfileInclude;

export function findProfileByUserId(tx: Prisma.TransactionClient, userId: string) {
  return tx.profile.findUnique({ where: { userId }, include: profileDetailInclude });
}

export interface ProfileWriteData {
  displayName?: string;
  favoriteGameId?: string | null;
  favoriteCharacter?: string | null;
  theme?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export function updateProfile(
  tx: Prisma.TransactionClient,
  userId: string,
  data: ProfileWriteData,
) {
  return tx.profile.update({ where: { userId }, data, include: profileDetailInclude });
}

export async function getPointsBalance(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<number> {
  const result = await tx.pointsTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

// Sem paginação real ainda (nenhum outro endpoint do projeto pagina) — só
// um teto defensivo simples.
export function listPointsTransactions(tx: Prisma.TransactionClient, userId: string) {
  return tx.pointsTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}
