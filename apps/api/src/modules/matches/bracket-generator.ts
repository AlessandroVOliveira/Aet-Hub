import type { Prisma } from '@prisma/client';
import * as matchesRepository from './matches.repository.js';

function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface BracketPlan {
  bracketSize: number;
  pairsCount: number;
  totalRounds: number;
  numByes: number;
  round1Seats: { position: number; registrationId: string | null }[];
  byes: { pairIndex: number; registrationId: string }[];
  matchPairs: { pairIndex: number; registrationAId: string; registrationBId: string }[];
}

// Função pura (sem tx, testável isoladamente): embaralha os inscritos e
// calcula byes/pares da rodada 1. numByes = bracketSize - N é sempre
// estritamente menor que pairsCount (bracketSize/2), porque
// nextPowerOfTwo garante N > bracketSize/2 — logo nunca dois byes calham
// no mesmo par.
export function computeBracketPlan(registrationIds: string[]): BracketPlan {
  const n = registrationIds.length;
  const bracketSize = nextPowerOfTwo(n);
  const pairsCount = bracketSize / 2;
  const totalRounds = Math.log2(bracketSize) + 1;
  const numByes = bracketSize - n;
  const shuffled = shuffle(registrationIds);

  const round1Seats: BracketPlan['round1Seats'] = [];
  const byes: BracketPlan['byes'] = [];
  const matchPairs: BracketPlan['matchPairs'] = [];

  let cursor = 0;
  for (let pairIndex = 1; pairIndex <= pairsCount; pairIndex++) {
    if (pairIndex <= numByes) {
      const registrationId = shuffled[cursor++]!;
      round1Seats.push({ position: 2 * pairIndex - 1, registrationId });
      round1Seats.push({ position: 2 * pairIndex, registrationId: null });
      byes.push({ pairIndex, registrationId });
    } else {
      const registrationAId = shuffled[cursor++]!;
      const registrationBId = shuffled[cursor++]!;
      round1Seats.push({ position: 2 * pairIndex - 1, registrationId: registrationAId });
      round1Seats.push({ position: 2 * pairIndex, registrationId: registrationBId });
      matchPairs.push({ pairIndex, registrationAId, registrationBId });
    }
  }

  return { bracketSize, pairsCount, totalRounds, numByes, round1Seats, byes, matchPairs };
}

// Dado um slot que acabou de ser preenchido (round/position), olha o
// irmão do mesmo par; se os dois lados estiverem prontos e existir rodada
// seguinte, cria o Match daquele par — sem duplicar se já existir.
// Reaproveitada tanto na geração (cascata de byes) quanto no registro de
// resultado de partida.
export async function maybeCreateNextRoundMatch(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  round: number,
  position: number,
): Promise<void> {
  const siblingPosition = position % 2 === 1 ? position + 1 : position - 1;
  const [currentSlot, siblingSlot] = await Promise.all([
    matchesRepository.findBracketSlotByPosition(tx, tournamentId, round, position),
    matchesRepository.findBracketSlotByPosition(tx, tournamentId, round, siblingPosition),
  ]);
  if (!currentSlot?.registrationId || !siblingSlot?.registrationId) return;

  const nextPosition = Math.ceil(position / 2);
  const nextSlot = await matchesRepository.findBracketSlotByPosition(
    tx,
    tournamentId,
    round + 1,
    nextPosition,
  );
  if (!nextSlot) return; // round atual é a rodada final — não há próximo slot

  const existingMatch = await matchesRepository.findMatchByBracketSlotId(tx, nextSlot.id);
  if (existingMatch) return;

  const [slotA, slotB] = position % 2 === 1 ? [currentSlot, siblingSlot] : [siblingSlot, currentSlot];

  await matchesRepository.createMatch(tx, {
    tournamentId,
    bracketSlotId: nextSlot.id,
    registrationAId: slotA.registrationId!,
    registrationBId: slotB.registrationId!,
  });
}
