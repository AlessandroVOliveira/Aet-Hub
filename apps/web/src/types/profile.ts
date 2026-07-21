import type { Registration } from './registration';

export interface UpdateProfilePayload {
  displayName?: string;
  favoriteGameId?: string | null;
  favoriteCharacter?: string | null;
  theme?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export type MatchResult = 'WIN' | 'LOSS';

export interface MatchHistoryOpponent {
  username: string;
  displayName: string | null;
}

export interface MatchHistoryEntry {
  matchId: string;
  tournamentId: string;
  tournamentName: string;
  opponent: MatchHistoryOpponent | null;
  result: MatchResult;
  scoreSelf: number | null;
  scoreOpponent: number | null;
  playedAt: string;
}

export interface GetMyHistoryResponse {
  registrations: Registration[];
  matches: MatchHistoryEntry[];
}
