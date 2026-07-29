import type { Match, Prisma } from '@prisma/client';
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
// resultado de partida. Retorna o Match criado (ou null nos early-returns/
// quando já existia) para o caller poder gerar notificações MATCH_READY
// sem precisar reconsultar o banco.
export async function maybeCreateNextRoundMatch(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  round: number,
  position: number,
): Promise<Match | null> {
  const siblingPosition = position % 2 === 1 ? position + 1 : position - 1;
  const [currentSlot, siblingSlot] = await Promise.all([
    matchesRepository.findBracketSlotByPosition(tx, tournamentId, 'WINNERS', round, position),
    matchesRepository.findBracketSlotByPosition(tx, tournamentId, 'WINNERS', round, siblingPosition),
  ]);
  if (!currentSlot?.registrationId || !siblingSlot?.registrationId) return null;

  const nextPosition = Math.ceil(position / 2);
  const nextSlot = await matchesRepository.findBracketSlotByPosition(
    tx,
    tournamentId,
    'WINNERS',
    round + 1,
    nextPosition,
  );
  if (!nextSlot) return null; // round atual é a rodada final — não há próximo slot

  const existingMatch = await matchesRepository.findMatchByBracketSlotId(tx, nextSlot.id);
  if (existingMatch) return null;

  const [slotA, slotB] = position % 2 === 1 ? [currentSlot, siblingSlot] : [siblingSlot, currentSlot];

  return matchesRepository.createMatch(tx, {
    tournamentId,
    bracketSlotId: nextSlot.id,
    registrationAId: slotA.registrationId!,
    registrationBId: slotB.registrationId!,
  });
}

// ============================================================================
// Eliminação dupla. Motor cobre geração (WB+LB+grande final com reset) e
// avanço de partidas. Colocação final e correção de resultado (RF-19) para
// chave dupla ficam de fora desta fatia (guards em
// tournaments.service.ts/matches.service.ts).
// ============================================================================

// Empareia sequencialmente `count` posições (1..count); se count for
// ímpar, a última posição fica de bye (avança sozinha, sem partida). Usado
// tanto pra achar o par de uma posição quanto pra decidir se uma posição é
// a bye da rodada — mesma técnica de nextPowerOfTwo/bye do WB, mas
// reaproveitável em QUALQUER contagem (não só potência de 2), porque a LB
// não tem a obrigação de ficar "redonda" a cada rodada.
function pairSequential(count: number): { byePosition: number | null } {
  return { byePosition: count % 2 === 1 ? count : null };
}

// Posiciona os sobreviventes da LB (que acabaram de vencer a rodada
// anterior) e os recém-caídos da WB numa rodada "maior" da LB, intercalados
// com espelhamento (sobrevivente[k] x caído[recémCaídos - k + 1]) — técnica
// padrão pra reduzir a chance de revanche imediata contra quem já jogou na
// mesma rodada da WB. Quando as contagens não batem (efeito colateral de
// bye na rodada 1 da WB, o único ponto irregular de todo o sistema), o
// excedente de qualquer um dos dois lados é anexado ao final e pareado
// sequencialmente entre si (ou vira bye sozinho, se sobrar só 1).
function assignMajorRoundPositions(
  survivorCount: number,
  freshLoserCount: number,
): { entering: number; survivorPosition: Map<number, number>; wbLoserPosition: Map<number, number> } {
  const survivorPosition = new Map<number, number>();
  const wbLoserPosition = new Map<number, number>();
  const mirrorCount = Math.min(survivorCount, freshLoserCount);

  let nextPosition = 1;
  for (let k = 1; k <= mirrorCount; k++) {
    survivorPosition.set(k, nextPosition++);
    wbLoserPosition.set(freshLoserCount - k + 1, nextPosition++);
  }
  for (let k = mirrorCount + 1; k <= survivorCount; k++) {
    survivorPosition.set(k, nextPosition++);
  }
  for (let j = 1; j <= freshLoserCount - mirrorCount; j++) {
    wbLoserPosition.set(j, nextPosition++);
  }

  return { entering: survivorCount + freshLoserCount, survivorPosition, wbLoserPosition };
}

export interface LbRoundPlan {
  lbRound: number;
  entering: number;
  kind: 'entry' | 'minor' | 'major' | 'terminal';
  wbRound?: number;
  // Só presente em rodadas 'major': mapeia a posição de origem (rodada
  // anterior da LB, ou índice de par da rodada da WB) pra posição nesta
  // rodada. Rodadas 'minor'/'terminal' usam o halving genérico (posição de
  // destino = índice de par da rodada anterior) — não precisam de mapa.
  survivorPositionFromPrev?: Map<number, number>;
  wbLoserPosition?: Map<number, number>;
}

// Função pura, sem tx — o único dado que varia com N (em vez de só
// bracketSize) é wbRound1MatchCount (quantas partidas reais, não bye, a
// rodada 1 da WB tem). Da rodada 2 em diante a WB nunca tem bye (bracketSize
// já é potência de 2), então o resto do formato só depende de wbRounds.
export function computeLosersBracketSchedule(
  wbRounds: number,
  wbRound1MatchCount: number,
): LbRoundPlan[] {
  const rounds: LbRoundPlan[] = [];
  let lbRound = 1;

  const entryPosition = new Map<number, number>();
  for (let pairIndex = 1; pairIndex <= wbRound1MatchCount; pairIndex++) {
    entryPosition.set(pairIndex, pairIndex);
  }
  rounds.push({
    lbRound,
    entering: wbRound1MatchCount,
    kind: 'entry',
    wbRound: 1,
    wbLoserPosition: entryPosition,
  });
  let survivorCount = Math.ceil(wbRound1MatchCount / 2);
  lbRound++;

  for (let wbRound = 2; wbRound <= wbRounds; wbRound++) {
    const freshLoserCount = 2 ** (wbRounds - wbRound);
    const assignment = assignMajorRoundPositions(survivorCount, freshLoserCount);
    rounds.push({
      lbRound,
      entering: assignment.entering,
      kind: 'major',
      wbRound,
      survivorPositionFromPrev: assignment.survivorPosition,
      wbLoserPosition: assignment.wbLoserPosition,
    });
    survivorCount = Math.ceil(assignment.entering / 2);
    lbRound++;

    if (wbRound < wbRounds) {
      rounds.push({ lbRound, entering: survivorCount, kind: 'minor' });
      survivorCount = Math.ceil(survivorCount / 2);
      lbRound++;
    }
  }

  // Slot terminal — campeão da LB, mesmo papel do slot campeão da WB
  // (round wbRounds+1/posição 1): recebe o vencedor da final da LB, sem
  // partida própria, alimenta a grande final.
  rounds.push({ lbRound, entering: survivorCount, kind: 'terminal' });

  return rounds;
}

export interface DoubleEliminationPlan {
  wb: BracketPlan;
  wbRounds: number;
  lbSchedule: LbRoundPlan[];
}

// Função pura (sem tx) — combina o plano da WB (idêntico ao de eliminação
// simples) com o cronograma da LB. Testável isoladamente, mesmo espírito de
// computeBracketPlan.
export function computeDoubleEliminationPlan(registrationIds: string[]): DoubleEliminationPlan {
  const wb = computeBracketPlan(registrationIds);
  const wbRounds = wb.totalRounds - 1;
  const lbSchedule = computeLosersBracketSchedule(wbRounds, wb.matchPairs.length);
  return { wb, wbRounds, lbSchedule };
}

// bracketSize (via a contagem de slots da rodada 1 da WB — um slot por
// ASSENTO, não por par: rodada 1 sempre tem bracketSize slots, ver o loop
// de criação em matches.service.ts) é o único número que a cascata em
// runtime precisa recompor pra saber wbRounds — não depende de quem já
// jogou o quê, só da estrutura criada em generateBracket.
export async function computeWbRounds(
  tx: Prisma.TransactionClient,
  tournamentId: string,
): Promise<number> {
  const bracketSize = await matchesRepository.countBracketSlotsInRound(tx, tournamentId, 'WINNERS', 1);
  return Math.log2(bracketSize);
}

// countMatchesByDestinationRound(round: 2) conta as partidas cuja rodada de
// ORIGEM é a rodada 1 da WB (destino = rodada 2) — o segundo (e último)
// número que varia com N em vez de só bracketSize/wbRounds.
async function loadLosersBracketSchedule(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  wbRounds: number,
): Promise<LbRoundPlan[]> {
  const wbRound1MatchCount = await matchesRepository.countMatchesByDestinationRound(
    tx,
    tournamentId,
    'WINNERS',
    2,
  );
  return computeLosersBracketSchedule(wbRounds, wbRound1MatchCount);
}

// Chamada depois que maybeCreateNextRoundMatch cria uma partida da WB via
// cascata (rodada 2+) — a própria maybeCreateNextRoundMatch não sabe nada
// de eliminação dupla, então o wiring do destino do perdedor na LB é um
// passo à parte, só pra torneios DOUBLE_ELIMINATION. Rodada 1 já nasce com
// loserBracketSlotId setado na criação (generateBracket tem o plano
// completo ali) — esta função só cobre rodada 2 em diante.
export async function wireWbLoserDestination(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  wbRounds: number,
  matchId: string,
  originRound: number,
  pairIndex: number,
): Promise<void> {
  if (originRound > wbRounds) return; // defensivo — não deveria acontecer
  const schedule = await loadLosersBracketSchedule(tx, tournamentId, wbRounds);
  const roundPlan = schedule.find((round) => round.wbRound === originRound && round.wbLoserPosition);
  const lbPosition = roundPlan?.wbLoserPosition?.get(pairIndex);
  if (!roundPlan || lbPosition === undefined) return;

  const lbSlot = await matchesRepository.findBracketSlotByPosition(
    tx,
    tournamentId,
    'LOSERS',
    roundPlan.lbRound,
    lbPosition,
  );
  if (!lbSlot) return;
  await matchesRepository.setMatchLoserBracketSlot(tx, matchId, lbSlot.id);
}

// Avança a LB a partir de uma posição recém-preenchida (round/position já
// têm registrationId, seja por roteamento de perdedor da WB ou por vitória
// dentro da própria LB). Se a posição é a bye da rodada, propaga sozinha
// pra rodada seguinte (recursivo — cobre o caso raro de bye encadeado); se
// não, espera o par ficar pronto e cria a partida (destino calculado via
// cronograma: halving simples se a próxima rodada for 'minor'/'terminal',
// mapa de espelhamento se for 'major'). Rodada 'terminal' (campeão da LB)
// não tem mais nada a avançar — quem chama depois checa maybeCreateGrandFinal.
export async function checkLosersBracketAdvancement(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  round: number,
  position: number,
): Promise<Match | null> {
  const wbRounds = await computeWbRounds(tx, tournamentId);
  const schedule = await loadLosersBracketSchedule(tx, tournamentId, wbRounds);
  const roundPlan = schedule.find((r) => r.lbRound === round);
  if (!roundPlan || roundPlan.kind === 'terminal') return null;

  const currentSlot = await matchesRepository.findBracketSlotByPosition(
    tx,
    tournamentId,
    'LOSERS',
    round,
    position,
  );
  if (!currentSlot?.registrationId) return null;

  const { byePosition } = pairSequential(roundPlan.entering);
  const nextRoundPlan = schedule.find((r) => r.lbRound === round + 1);
  if (!nextRoundPlan) return null; // defensivo — todo round não-terminal tem sucessor

  if (byePosition === position) {
    const destPosition =
      nextRoundPlan.kind === 'major'
        ? nextRoundPlan.survivorPositionFromPrev!.get(position)!
        : position;
    const destSlot = await matchesRepository.findBracketSlotByPosition(
      tx,
      tournamentId,
      'LOSERS',
      round + 1,
      destPosition,
    );
    if (!destSlot) return null;
    await matchesRepository.updateBracketSlotRegistration(tx, destSlot.id, currentSlot.registrationId);
    return checkLosersBracketAdvancement(tx, tournamentId, round + 1, destPosition);
  }

  const siblingPosition = position % 2 === 1 ? position + 1 : position - 1;
  const siblingSlot = await matchesRepository.findBracketSlotByPosition(
    tx,
    tournamentId,
    'LOSERS',
    round,
    siblingPosition,
  );
  if (!siblingSlot?.registrationId) return null;

  const pairIndex = Math.ceil(position / 2);
  const destPosition =
    nextRoundPlan.kind === 'major' ? nextRoundPlan.survivorPositionFromPrev!.get(pairIndex)! : pairIndex;
  const destSlot = await matchesRepository.findBracketSlotByPosition(
    tx,
    tournamentId,
    'LOSERS',
    round + 1,
    destPosition,
  );
  if (!destSlot) return null;

  const existingMatch = await matchesRepository.findMatchByBracketSlotId(tx, destSlot.id);
  if (existingMatch) return null;

  const [slotA, slotB] = position % 2 === 1 ? [currentSlot, siblingSlot] : [siblingSlot, currentSlot];
  return matchesRepository.createMatch(tx, {
    tournamentId,
    bracketSlotId: destSlot.id,
    registrationAId: slotA.registrationId!,
    registrationBId: slotB.registrationId!,
  });
}

// Roteia o perdedor de uma partida da WB pro slot de destino na LB
// (precomputado em wbMatch.loserBracketSlotId — ver wireWbLoserDestination e
// o seeding da rodada 1 em generateBracket) e dispara o avanço da LB a
// partir de lá.
export async function maybeRouteLoserToLosersBracket(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  wbMatch: Match,
  loserRegistrationId: string,
): Promise<Match | null> {
  if (!wbMatch.loserBracketSlotId) return null;
  const lbSlot = await matchesRepository.findBracketSlotById(tx, wbMatch.loserBracketSlotId);
  await matchesRepository.updateBracketSlotRegistration(tx, lbSlot.id, loserRegistrationId);
  return checkLosersBracketAdvancement(tx, tournamentId, lbSlot.round, lbSlot.position);
}

// Cria a grande final (GRAND_FINAL round 1) assim que o campeão da WB e o
// campeão da LB estiverem os dois definidos — seat A é sempre quem veio da
// WB (0 derrotas), seat B sempre quem veio da LB (1 derrota), atribuição
// determinística por construção (não por paridade de posição) — importante
// pra maybeCreateGrandFinalReset saber quem é quem sem precisar recalcular.
export async function maybeCreateGrandFinal(
  tx: Prisma.TransactionClient,
  tournamentId: string,
): Promise<Match | null> {
  const wbRounds = await computeWbRounds(tx, tournamentId);
  const wbChampionSlot = await matchesRepository.findBracketSlotByPosition(
    tx,
    tournamentId,
    'WINNERS',
    wbRounds + 1,
    1,
  );
  const schedule = await loadLosersBracketSchedule(tx, tournamentId, wbRounds);
  const lbTerminal = schedule.find((r) => r.kind === 'terminal')!;
  const lbChampionSlot = await matchesRepository.findBracketSlotByPosition(
    tx,
    tournamentId,
    'LOSERS',
    lbTerminal.lbRound,
    1,
  );
  if (!wbChampionSlot?.registrationId || !lbChampionSlot?.registrationId) return null;

  const gf1Slot = await matchesRepository.findBracketSlotByPosition(
    tx,
    tournamentId,
    'GRAND_FINAL',
    1,
    1,
  );
  if (!gf1Slot) return null;
  const existing = await matchesRepository.findMatchByBracketSlotId(tx, gf1Slot.id);
  if (existing) return null;

  return matchesRepository.createMatch(tx, {
    tournamentId,
    bracketSlotId: gf1Slot.id,
    registrationAId: wbChampionSlot.registrationId,
    registrationBId: lbChampionSlot.registrationId,
  });
}

// Só cria a segunda partida da grande final (reset de chave) quando quem
// veio da LB (seat B) vence a primeira — nesse caso quem veio da WB agora
// tem 1 derrota (empatado com o adversário), e uma segunda partida decide o
// campeão de verdade. Se quem veio da WB vencer a GF1, o torneio já está
// decidido, nada mais é criado.
export async function maybeCreateGrandFinalReset(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  gf1Match: Match,
  winnerRegistrationId: string,
): Promise<Match | null> {
  if (winnerRegistrationId === gf1Match.registrationAId) return null;

  const gf2Slot = await matchesRepository.findBracketSlotByPosition(
    tx,
    tournamentId,
    'GRAND_FINAL',
    2,
    1,
  );
  if (!gf2Slot) return null;
  const existing = await matchesRepository.findMatchByBracketSlotId(tx, gf2Slot.id);
  if (existing) return null;

  return matchesRepository.createMatch(tx, {
    tournamentId,
    bracketSlotId: gf2Slot.id,
    registrationAId: gf1Match.registrationAId!,
    registrationBId: gf1Match.registrationBId!,
  });
}
