import type { TiebreakerRule } from '@prisma/client';

export interface MatchOutcome {
  matchId: string;
  round: number;
  registrationAId: string;
  registrationBId: string;
  winnerRegistrationId: string;
}

export interface PlacementResult {
  registrationId: string;
  placement: number;
}

// Convenção de eliminação simples: quem perde na partida cuja rodada de
// destino é R empata em placement = 2^(maxRound - R) + 1 com todo mundo
// eliminado na mesma rodada; quem perde a final (R = maxRound) fica em
// 2º; o vencedor da final fica em 1º. Ver applyTiebreaker abaixo pra como
// o empate dentro de um mesmo placement é quebrado (RF-18).
export function computePlacements(
  matches: MatchOutcome[],
  tiebreakerRule?: TiebreakerRule | null,
): PlacementResult[] {
  if (matches.length === 0) return [];
  const maxRound = Math.max(...matches.map((match) => match.round));
  const results: PlacementResult[] = [];

  for (const match of matches) {
    const loserRegistrationId =
      match.winnerRegistrationId === match.registrationAId
        ? match.registrationBId
        : match.registrationAId;
    const placement = match.round === maxRound ? 2 : 2 ** (maxRound - match.round) + 1;
    results.push({ registrationId: loserRegistrationId, placement });
    if (match.round === maxRound) {
      results.push({ registrationId: match.winnerRegistrationId, placement: 1 });
    }
  }

  if (!tiebreakerRule) return results;
  return applyTiebreaker(results, matches, tiebreakerRule);
}

// Quebra o empate DENTRO de cada grupo que compartilha o mesmo placement
// base (ex.: os dois perdedores da semifinal, ambos em "3º"). A métrica de
// desempate varia por regra, mas a renumeração é a mesma fórmula pras
// duas: novoPlacement = basePlacement + (nº de colegas do MESMO grupo com
// métrica estritamente maior) — basePlacement já representa corretamente
// "1 + quantos jogadores estão em grupos melhores", então só falta o
// deslocamento dentro do próprio grupo. Empates residuais na métrica
// (nenhum colega com valor maior) continuam compartilhando o mesmo
// placement — é o fallback, automático pela própria fórmula.
function applyTiebreaker(
  results: PlacementResult[],
  matches: MatchOutcome[],
  tiebreakerRule: TiebreakerRule,
): PlacementResult[] {
  const groups = new Map<number, PlacementResult[]>();
  for (const result of results) {
    const group = groups.get(result.placement);
    if (group) {
      group.push(result);
    } else {
      groups.set(result.placement, [result]);
    }
  }

  // WIN_BALANCE: saldo de vitórias em TODO o torneio (perdas são sempre 1
  // pra qualquer não-campeão em eliminação simples, então contar vitórias
  // já basta). Pré-computado uma vez, reaproveitado por todos os grupos.
  const winCountByRegistrationId = new Map<string, number>();
  if (tiebreakerRule === 'WIN_BALANCE') {
    for (const match of matches) {
      winCountByRegistrationId.set(
        match.winnerRegistrationId,
        (winCountByRegistrationId.get(match.winnerRegistrationId) ?? 0) + 1,
      );
    }
  }

  const finalResults: PlacementResult[] = [];
  for (const [basePlacement, group] of groups) {
    if (group.length === 1) {
      finalResults.push(group[0]!);
      continue;
    }

    const metricByRegistrationId =
      tiebreakerRule === 'WIN_BALANCE'
        ? new Map(group.map(({ registrationId }) => [registrationId, winCountByRegistrationId.get(registrationId) ?? 0]))
        : computeHeadToHeadWins(group, matches);

    for (const { registrationId } of group) {
      const ownMetric = metricByRegistrationId.get(registrationId) ?? 0;
      const rankedAbove = group.filter(
        (other) => (metricByRegistrationId.get(other.registrationId) ?? 0) > ownMetric,
      ).length;
      finalResults.push({ registrationId, placement: basePlacement + rankedAbove });
    }
  }

  return finalResults;
}

// HEAD_TO_HEAD: vitórias contadas só entre partidas onde os dois lados
// pertencem ao mesmo grupo empatado. Em eliminação simples, dois jogadores
// eliminados na mesma rodada nunca se enfrentaram entre si (se tivessem
// jogado, um já teria sido eliminado antes) — a métrica é sempre 0 pra
// todo mundo hoje, caindo no fallback de placement compartilhado. Mantido
// genérico e correto pra funcionar sozinho se o motor de chaveamento
// ganhar eliminação dupla/repescagem no futuro.
function computeHeadToHeadWins(
  group: PlacementResult[],
  matches: MatchOutcome[],
): Map<string, number> {
  const groupIds = new Set(group.map((result) => result.registrationId));
  const winCount = new Map<string, number>();
  for (const match of matches) {
    if (groupIds.has(match.registrationAId) && groupIds.has(match.registrationBId)) {
      winCount.set(match.winnerRegistrationId, (winCount.get(match.winnerRegistrationId) ?? 0) + 1);
    }
  }
  return winCount;
}
