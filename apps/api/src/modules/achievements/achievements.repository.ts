import type { Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

export function listActiveAchievements(tx: Prisma.TransactionClient) {
  return tx.achievement.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
}

export function listAllAchievements(tx: Prisma.TransactionClient) {
  return tx.achievement.findMany({ orderBy: { createdAt: 'asc' } });
}

export function findAchievementById(tx: Prisma.TransactionClient, id: string) {
  return tx.achievement.findUnique({ where: { id } });
}

export function createAchievement(
  tx: Prisma.TransactionClient,
  data: Prisma.AchievementCreateInput,
) {
  return tx.achievement.create({ data });
}

export function updateAchievement(
  tx: Prisma.TransactionClient,
  id: string,
  data: Prisma.AchievementUpdateInput,
) {
  return tx.achievement.update({ where: { id }, data });
}

// Usado por completeTournament: só os códigos que o achievement-evaluator
// .ts conhece hardcoded, e só se estiverem ativos no catálogo (admin pode
// desativar uma conquista sem quebrar a avaliação — ela simplesmente para
// de ser concedida). Devolve linhas cruas (não um Map) porque o service
// precisa tanto de id (pro evaluator) quanto de name (pro texto da
// notificação ACHIEVEMENT_UNLOCKED).
export function findAchievementsByCodes(
  tx: Prisma.TransactionClient,
  codes: string[],
): Promise<{ id: string; code: string; name: string }[]> {
  return tx.achievement.findMany({
    where: { code: { in: codes }, isActive: true },
    select: { id: true, code: true, name: true },
  });
}

// Pré-checagem antes do avaliador decidir o que desbloquear — chave
// "userId:achievementId" (mesmo par do @@unique do model).
export async function findExistingUnlocks(
  tx: Prisma.TransactionClient,
  userIds: string[],
  achievementIds: string[],
): Promise<Set<string>> {
  if (userIds.length === 0 || achievementIds.length === 0) return new Set();
  const rows = await tx.userAchievement.findMany({
    where: { userId: { in: userIds }, achievementId: { in: achievementIds } },
    select: { userId: true, achievementId: true },
  });
  return new Set(rows.map((row) => `${row.userId}:${row.achievementId}`));
}

// Volume por torneio é pequeno (no máximo 3 conquistas × N participantes),
// e cada unlock precisa do próprio id pra virar refId da notificação
// ACHIEVEMENT_UNLOCKED — createMany não devolve ids, então create em loop
// (chamado pelo service) em vez de createMany aqui.
export function createUserAchievement(
  tx: Prisma.TransactionClient,
  data: { userId: string; achievementId: string; tournamentId: string },
) {
  return tx.userAchievement.create({ data });
}

export function findUnlockedByUserId(tx: Prisma.TransactionClient, userId: string) {
  return tx.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { unlockedAt: 'desc' },
  });
}

// Usado pelo armário cosmético (modules/cosmetics) pra derivar posse de
// item destravado por conquista — só os códigos, sem o resto da linha.
export async function findUnlockedAchievementCodes(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<Set<string>> {
  const rows = await tx.userAchievement.findMany({
    where: { userId },
    select: { achievement: { select: { code: true } } },
  });
  return new Set(rows.map((row) => row.achievement.code));
}
