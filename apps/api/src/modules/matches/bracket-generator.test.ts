import { describe, expect, it } from 'vitest';
import {
  computeDoubleEliminationPlan,
  computeLosersBracketSchedule,
} from './bracket-generator.js';

function ids(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `reg-${index + 1}`);
}

// Toda rodada (entry/major) precisa cobrir 1..entering sem buraco nem
// repetição, juntando wbLoserPosition + survivorPositionFromPrev — é a
// garantia estrutural de que nenhum BracketSlot fica órfão ou duplicado.
function assertPositionsCoverRound(round: {
  entering: number;
  survivorPositionFromPrev?: Map<number, number>;
  wbLoserPosition?: Map<number, number>;
}) {
  const covered = [
    ...(round.survivorPositionFromPrev?.values() ?? []),
    ...(round.wbLoserPosition?.values() ?? []),
  ];
  expect(new Set(covered).size).toBe(covered.length); // sem duplicata
  expect([...covered].sort((a, b) => a - b)).toEqual(
    Array.from({ length: round.entering }, (_, i) => i + 1),
  );
}

describe('computeLosersBracketSchedule', () => {
  it('gera 2*(wbRounds-1) rodadas de partida + 1 terminal, para qualquer wbRounds >= 2', () => {
    for (const wbRounds of [2, 3, 4, 5]) {
      const schedule = computeLosersBracketSchedule(wbRounds, 2 ** (wbRounds - 1));
      const nonTerminal = schedule.filter((r) => r.kind !== 'terminal');
      expect(nonTerminal).toHaveLength(2 * (wbRounds - 1));
      expect(schedule.at(-1)!.kind).toBe('terminal');
      expect(schedule.at(-1)!.entering).toBe(1);
    }
  });

  it('N=4 (wbRounds=2, sem bye): LB é [2 entry, 2 major, 1 terminal]', () => {
    const schedule = computeLosersBracketSchedule(2, 2);
    expect(schedule.map((r) => [r.kind, r.entering])).toEqual([
      ['entry', 2],
      ['major', 2],
      ['terminal', 1],
    ]);
  });

  it('N=8 (wbRounds=3, sem bye): LB é [4 entry, 4 major, 2 minor, 2 major, 1 terminal]', () => {
    const schedule = computeLosersBracketSchedule(3, 4);
    expect(schedule.map((r) => [r.kind, r.entering])).toEqual([
      ['entry', 4],
      ['major', 4],
      ['minor', 2],
      ['major', 2],
      ['terminal', 1],
    ]);
  });

  it('N=5 (wbRounds=3, só 1 partida real na rodada 1 da WB, 3 byes): não quebra e cobre as posições', () => {
    // bracketSize=8, pairsCount=4, numByes=3 -> matchPairs.length=1.
    const schedule = computeLosersBracketSchedule(3, 1);
    expect(schedule.map((r) => [r.kind, r.entering])).toEqual([
      ['entry', 1],
      ['major', 3],
      ['minor', 2],
      ['major', 2],
      ['terminal', 1],
    ]);
    for (const round of schedule) {
      if (round.kind === 'entry' || round.kind === 'major') assertPositionsCoverRound(round);
    }
  });

  it('rodadas entry/major sempre cobrem 1..entering sem duplicata, pra vários wbRound1MatchCount', () => {
    for (const wbRounds of [2, 3, 4]) {
      for (let wbRound1MatchCount = 1; wbRound1MatchCount <= 2 ** (wbRounds - 1); wbRound1MatchCount++) {
        const schedule = computeLosersBracketSchedule(wbRounds, wbRound1MatchCount);
        for (const round of schedule) {
          if (round.kind === 'entry' || round.kind === 'major') assertPositionsCoverRound(round);
        }
      }
    }
  });
});

describe('computeDoubleEliminationPlan', () => {
  it.each([4, 8, 16])('N=%i (potência exata): wbRounds e cronograma da LB batem', (n) => {
    const plan = computeDoubleEliminationPlan(ids(n));
    const expectedWbRounds = Math.log2(n);
    expect(plan.wbRounds).toBe(expectedWbRounds);
    expect(plan.wb.matchPairs).toHaveLength(n / 2); // sem bye numa potência exata
    expect(plan.lbSchedule.filter((r) => r.kind !== 'terminal')).toHaveLength(
      2 * (expectedWbRounds - 1),
    );
  });

  it.each([5, 6, 7, 9, 11])('N=%i (não potência de 2): todo inscrito aparece 1x na rodada 1 da WB', (n) => {
    const plan = computeDoubleEliminationPlan(ids(n));
    const seated = plan.wb.round1Seats
      .map((seat) => seat.registrationId)
      .filter((id): id is string => id !== null);
    expect(new Set(seated).size).toBe(n);
    expect(seated).toHaveLength(n);

    // LB nasce só com a estrutura (ninguém jogou ainda) — mas o cronograma
    // tem que ser internamente consistente mesmo com bye na rodada 1 da WB.
    for (const round of plan.lbSchedule) {
      if (round.kind === 'entry' || round.kind === 'major') assertPositionsCoverRound(round);
    }
  });

  it('rejeita silenciosamente nada — bracketSize=2 (N=2..3, wbRounds=1) não é usado em produção (guard fica em tournaments.service), mas a função não deve lançar', () => {
    expect(() => computeDoubleEliminationPlan(ids(2))).not.toThrow();
  });
});
