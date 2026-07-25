import type { Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

export function createFollow(
  tx: Prisma.TransactionClient,
  data: {
    followerId: string;
    followingId: string;
    followerDisplayName: string;
    followingDisplayName: string;
  },
) {
  return tx.follow.create({ data });
}

// deleteMany em vez de delete: unfollow é idempotente por design (o
// service decide 404 a partir do count, sem depender de uma exceção de
// "registro não encontrado" do Prisma).
export async function deleteFollow(
  tx: Prisma.TransactionClient,
  followerId: string,
  followingId: string,
): Promise<boolean> {
  const result = await tx.follow.deleteMany({ where: { followerId, followingId } });
  return result.count > 0;
}

export function listFollowing(tx: Prisma.TransactionClient, userId: string) {
  return tx.follow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: 'desc' },
  });
}

export function listFollowers(tx: Prisma.TransactionClient, userId: string) {
  return tx.follow.findMany({
    where: { followingId: userId },
    orderBy: { createdAt: 'desc' },
  });
}
