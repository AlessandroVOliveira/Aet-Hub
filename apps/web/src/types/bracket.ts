export type BracketSide = 'WINNERS' | 'LOSERS';
export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'VOIDED';

export interface RegistrationSeat {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';
  finalPlacement: number | null;
  user: {
    id: string;
    username: string;
    profile: { displayName: string } | null;
  };
}

export interface BracketSlot {
  id: string;
  tournamentId: string;
  side: BracketSide;
  round: number;
  position: number;
  registrationId: string | null;
  registration: RegistrationSeat | null;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  bracketSlotId: string;
  registrationAId: string | null;
  registrationBId: string | null;
  winnerRegistrationId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  status: MatchStatus;
  scheduledAt: string | null;
  playedAt: string | null;
  voidedAt: string | null;
  voidedReason: string | null;
  correctedFromMatchId: string | null;
  createdAt: string;
  updatedAt: string;
  registrationA: RegistrationSeat | null;
  registrationB: RegistrationSeat | null;
  winner: RegistrationSeat | null;
}

export interface Bracket {
  slots: BracketSlot[];
  matches: Match[];
}

export interface GetBracketResponse {
  bracket: Bracket;
}

export interface RecordMatchResultPayload {
  winnerRegistrationId: string;
  scoreA?: number;
  scoreB?: number;
}

// Resposta sem includes (registrationA/B/winner ausentes) — nunca usar pra
// atualizar a UI diretamente, só pra satisfazer o tipo de retorno da
// mutation; a UI sempre confia no refetch de useBracket.
export interface RecordMatchResultResponse {
  match: Match;
}
