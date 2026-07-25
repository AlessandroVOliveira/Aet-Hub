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

// RF-25 (Fatia B) — tela admin /admin/usuarios. Sem paginação real ainda
// (mesmo padrão de listPointsTransactions/reports.repository#listReports).
export function listAllUsersForAdmin(tx: Prisma.TransactionClient) {
  return tx.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      isMuted: true,
      createdAt: true,
      profile: { select: { displayName: true } },
    },
    orderBy: { username: 'asc' },
    take: 500,
  });
}

export function findUserById(tx: Prisma.TransactionClient, id: string) {
  return tx.user.findUnique({ where: { id } });
}

export interface UserModerationData {
  isActive?: boolean;
  isMuted?: boolean;
}

// select explícito (nunca a linha inteira): sem isso, passwordHash vazaria
// na resposta de PATCH /users/:id/moderation — mesmo shape público de
// listAllUsersForAdmin acima.
export function updateUserModeration(
  tx: Prisma.TransactionClient,
  userId: string,
  data: UserModerationData,
) {
  return tx.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      isMuted: true,
      createdAt: true,
      profile: { select: { displayName: true } },
    },
  });
}
