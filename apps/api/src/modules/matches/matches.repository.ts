import type { Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.
//
// Match.bracketSlotId aponta para o BracketSlot de DESTINO: o slot (rodada
// seguinte) que vai receber o registrationId do vencedor.
// registrationAId/registrationBId são copiados dos dois BracketSlots de
// origem (rodada atual, posições irmãs) no momento em que o Match é
// criado — não são derivados via join a cada leitura.

export function createBracketSlot(
  tx: Prisma.TransactionClient,
  data: { tournamentId: string; round: number; position: number },
) {
  return tx.bracketSlot.create({ data: { ...data, side: 'WINNERS' } });
}

export function findBracketSlotByPosition(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  round: number,
  position: number,
) {
  return tx.bracketSlot.findUnique({
    where: { tournamentId_side_round_position: { tournamentId, side: 'WINNERS', round, position } },
  });
}

export function findBracketSlotById(tx: Prisma.TransactionClient, id: string) {
  return tx.bracketSlot.findUniqueOrThrow({ where: { id } });
}

export function updateBracketSlotRegistration(
  tx: Prisma.TransactionClient,
  slotId: string,
  registrationId: string,
) {
  return tx.bracketSlot.update({ where: { id: slotId }, data: { registrationId } });
}

export async function hasAnyBracketSlot(
  tx: Prisma.TransactionClient,
  tournamentId: string,
): Promise<boolean> {
  const slot = await tx.bracketSlot.findFirst({ where: { tournamentId }, select: { id: true } });
  return slot !== null;
}

export function createMatch(
  tx: Prisma.TransactionClient,
  data: {
    tournamentId: string;
    bracketSlotId: string;
    registrationAId: string;
    registrationBId: string;
  },
) {
  return tx.match.create({ data: { ...data, status: 'SCHEDULED' } });
}

export function findMatchByBracketSlotId(tx: Prisma.TransactionClient, bracketSlotId: string) {
  return tx.match.findFirst({ where: { bracketSlotId } });
}

export function findMatchById(tx: Prisma.TransactionClient, id: string) {
  return tx.match.findUnique({ where: { id } });
}

export function updateMatchResult(
  tx: Prisma.TransactionClient,
  id: string,
  data: { winnerRegistrationId: string; scoreA?: number; scoreB?: number },
) {
  return tx.match.update({
    where: { id },
    data: { ...data, status: 'COMPLETED', playedAt: new Date() },
  });
}

const registrationSeatInclude = {
  user: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
} satisfies Prisma.RegistrationInclude;

export async function findBracketByTournamentId(tx: Prisma.TransactionClient, tournamentId: string) {
  const [slots, matches] = await Promise.all([
    tx.bracketSlot.findMany({
      where: { tournamentId },
      include: { registration: { include: registrationSeatInclude } },
      orderBy: [{ round: 'asc' }, { position: 'asc' }],
    }),
    tx.match.findMany({
      where: { tournamentId },
      include: {
        registrationA: { include: registrationSeatInclude },
        registrationB: { include: registrationSeatInclude },
        winner: { include: registrationSeatInclude },
      },
      orderBy: [{ createdAt: 'asc' }],
    }),
  ]);
  return { slots, matches };
}
