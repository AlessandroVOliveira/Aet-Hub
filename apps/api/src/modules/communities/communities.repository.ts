import type { Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

// Incluir `game` é seguro sob RLS: a relação é OPCIONAL (gameId nullable) e
// `games` tem policy de SELECT `USING (true)` — nunca quebra por linha
// invisível (ver CLAUDE.md, diferente do caso de relação obrigatória).
const communityListInclude = {
  game: { select: { id: true, name: true, slug: true } },
  _count: { select: { posts: true } },
} satisfies Prisma.CommunityInclude;

export function listActiveCommunities(tx: Prisma.TransactionClient) {
  return tx.community.findMany({
    where: { isActive: true },
    include: communityListInclude,
    orderBy: { name: 'asc' },
    take: 100,
  });
}

export function listAllCommunities(tx: Prisma.TransactionClient) {
  return tx.community.findMany({
    include: communityListInclude,
    orderBy: { name: 'asc' },
    take: 100,
  });
}

export function findCommunityById(tx: Prisma.TransactionClient, id: string) {
  return tx.community.findUnique({ where: { id }, include: communityListInclude });
}

// Interface própria (não Prisma.CommunityCreateInput) — gameId é FK
// escalar aqui, e o tipo "checked" do Prisma só aceita a relação aninhada
// (`game: { connect }`). Mesmo padrão de TournamentWriteData em
// tournaments.repository.ts.
export interface CommunityWriteData {
  name: string;
  description: string;
  gameId: string | null;
  isActive: boolean;
}

export function createCommunity(tx: Prisma.TransactionClient, data: CommunityWriteData) {
  return tx.community.create({ data, include: communityListInclude });
}

export function updateCommunity(
  tx: Prisma.TransactionClient,
  id: string,
  data: Partial<CommunityWriteData>,
) {
  return tx.community.update({ where: { id }, data, include: communityListInclude });
}
