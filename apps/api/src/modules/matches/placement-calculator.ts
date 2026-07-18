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
// 2º; o vencedor da final fica em 1º. Não há desempate além da rodada de
// eliminação nesta fatia (RF-18, regra de desempate configurável, fica
// para fase futura).
export function computePlacements(matches: MatchOutcome[]): PlacementResult[] {
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

  return results;
}
