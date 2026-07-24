import type { Prisma } from '@prisma/client';

export function findGameById(tx: Prisma.TransactionClient, gameId: string) {
  return tx.game.findUnique({ where: { id: gameId } });
}

// Usado pelos módulos tournaments/users/communities pra validar gameId de
// FK antes de escrever — só existe aqui pra não fragmentar o mesmo lookup
// em cada módulo consumidor.
export function listActiveGames(tx: Prisma.TransactionClient) {
  return tx.game.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
}

export function listAllGames(tx: Prisma.TransactionClient) {
  return tx.game.findMany({ orderBy: { name: 'asc' } });
}

export function createGame(tx: Prisma.TransactionClient, data: Prisma.GameCreateInput) {
  return tx.game.create({ data });
}

export function updateGame(tx: Prisma.TransactionClient, id: string, data: Prisma.GameUpdateInput) {
  return tx.game.update({ where: { id }, data });
}
