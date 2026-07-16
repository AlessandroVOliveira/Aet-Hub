import type { BracketType, Prisma, TiebreakerRule, TournamentStatus } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui, senão o SET LOCAL de app.current_role
// feito pelo caller não vale para estas queries.

export function findGameById(tx: Prisma.TransactionClient, gameId: string) {
  return tx.game.findUnique({ where: { id: gameId }, select: { id: true } });
}

export interface TournamentWriteData {
  name: string;
  gameId: string;
  description?: string;
  registrationStartAt: Date;
  registrationEndAt: Date;
  checkinDeadlineAt: Date;
  eventStartAt: Date;
  entryFeeCents: number;
  bracketType: BracketType;
  tiebreakerRule?: TiebreakerRule;
  pointsPerWin: number;
  pointsPerLoss: number;
  sponsors: { name: string; logoUrl: string; link?: string }[];
  placementRewards: { placement: number; potPercentage: number; bonusPoints: number }[];
}

const tournamentDetailInclude = {
  game: true,
  sponsors: true,
  placementRewards: { orderBy: { placement: 'asc' } },
} satisfies Prisma.TournamentInclude;

const tournamentListInclude = {
  game: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.TournamentInclude;

export function createTournament(
  tx: Prisma.TransactionClient,
  data: TournamentWriteData & { createdByUserId: string },
) {
  const { sponsors, placementRewards, ...scalars } = data;
  return tx.tournament.create({
    data: {
      ...scalars,
      sponsors: { create: sponsors },
      placementRewards: { create: placementRewards },
    },
    include: tournamentDetailInclude,
  });
}

export function listTournaments(tx: Prisma.TransactionClient) {
  return tx.tournament.findMany({
    include: tournamentListInclude,
    orderBy: { eventStartAt: 'desc' },
  });
}

export function findTournamentById(tx: Prisma.TransactionClient, id: string) {
  return tx.tournament.findUnique({ where: { id }, include: tournamentDetailInclude });
}

// Usado pela listagem pública de torneios abertos para inscrição
// (módulo registrations) — não confundir com listTournaments, que é a
// listagem admin sem filtro de status.
export function listOpenTournamentsForRegistration(tx: Prisma.TransactionClient) {
  return tx.tournament.findMany({
    where: { status: 'REGISTRATION_OPEN' },
    include: tournamentListInclude,
    orderBy: { registrationEndAt: 'asc' },
  });
}

// Substituição completa: apaga e recria sponsors/placementRewards dentro da
// mesma transação interativa. São configuração do torneio sem ciclo de vida
// próprio (sem FK externa, sem histórico a preservar), então diffar por id
// adicionaria complexidade sem benefício real.
export async function replaceTournament(
  tx: Prisma.TransactionClient,
  id: string,
  data: TournamentWriteData & { status: TournamentStatus },
) {
  const { sponsors, placementRewards, ...scalars } = data;
  await tx.sponsor.deleteMany({ where: { tournamentId: id } });
  await tx.tournamentPlacementReward.deleteMany({ where: { tournamentId: id } });
  return tx.tournament.update({
    where: { id },
    data: {
      ...scalars,
      sponsors: { create: sponsors },
      placementRewards: { create: placementRewards },
    },
    include: tournamentDetailInclude,
  });
}

export function deleteTournament(tx: Prisma.TransactionClient, id: string) {
  return tx.tournament.delete({ where: { id } });
}
