export type TournamentStatus =
  | 'DRAFT'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'CHECKIN_OPEN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type BracketType = 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';
export type TiebreakerRule = 'HEAD_TO_HEAD' | 'WIN_BALANCE';

export interface TournamentGameSummary {
  id: string;
  name: string;
  slug: string;
}

export interface TournamentSummary {
  id: string;
  name: string;
  gameId: string;
  description: string | null;
  registrationStartAt: string;
  registrationEndAt: string;
  checkinDeadlineAt: string;
  eventStartAt: string;
  entryFeeCents: number;
  bracketType: BracketType;
  tiebreakerRule: TiebreakerRule | null;
  status: TournamentStatus;
  pointsPerWin: number;
  pointsPerLoss: number;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  game: TournamentGameSummary;
}

export interface GetOpenTournamentsResponse {
  tournaments: TournamentSummary[];
}
