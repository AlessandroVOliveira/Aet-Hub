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

// _max.round sobre BracketSlot é sempre totalRounds (todos os slots de
// todas as rodadas são criados de uma vez em generateBracket), então isto
// acha a partida cujo destino é o único slot da rodada final — retorna
// null se ela ainda não foi jogada.
export async function findFinalMatch(tx: Prisma.TransactionClient, tournamentId: string) {
  const { _max } = await tx.bracketSlot.aggregate({
    where: { tournamentId },
    _max: { round: true },
  });
  if (_max.round === null) return null;
  return tx.match.findFirst({ where: { tournamentId, bracketSlot: { round: _max.round } } });
}

export function findCompletedMatchesWithRound(tx: Prisma.TransactionClient, tournamentId: string) {
  return tx.match.findMany({
    where: { tournamentId, status: 'COMPLETED' },
    select: {
      id: true,
      registrationAId: true,
      registrationBId: true,
      winnerRegistrationId: true,
      bracketSlot: { select: { round: true } },
    },
  });
}

// RLS de registrations libera leitura de qualquer participante do mesmo
// torneio (policy registrations_tournament_participant_select), não só a
// própria inscrição — por isso aqui usamos sempre `select` explícito
// (nunca `include` bruto, que traria a linha inteira) ao ler a
// Registration de A/B/winner: qr_code_token é o "ingresso" de checkin de
// cada player e nunca deve ser exposto na visualização de chave/histórico
// de outra pessoa.
const registrationSeatSelect = {
  id: true,
  status: true,
  finalPlacement: true,
  user: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
} satisfies Prisma.RegistrationSelect;

export async function findBracketByTournamentId(
  tx: Prisma.TransactionClient,
  tournamentId: string,
) {
  const [slots, matches] = await Promise.all([
    tx.bracketSlot.findMany({
      where: { tournamentId },
      include: { registration: { select: registrationSeatSelect } },
      orderBy: [{ round: 'asc' }, { position: 'asc' }],
    }),
    tx.match.findMany({
      where: { tournamentId },
      include: {
        registrationA: { select: registrationSeatSelect },
        registrationB: { select: registrationSeatSelect },
        winner: { select: registrationSeatSelect },
      },
      orderBy: [{ createdAt: 'asc' }],
    }),
  ]);
  return { slots, matches };
}

export function findMatchesByUserId(tx: Prisma.TransactionClient, userId: string) {
  return tx.match.findMany({
    where: {
      status: 'COMPLETED',
      OR: [{ registrationA: { userId } }, { registrationB: { userId } }],
    },
    include: {
      tournament: { select: { id: true, name: true } },
      registrationA: { select: registrationSeatSelect },
      registrationB: { select: registrationSeatSelect },
    },
    orderBy: { playedAt: 'desc' },
  });
}
