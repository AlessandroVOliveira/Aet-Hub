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

export interface GetTournamentsResponse {
  tournaments: TournamentSummary[];
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  link: string | null;
}

export interface SponsorInput {
  name: string;
  logoUrl: string;
  link?: string;
}

// potPercentage vem como string do backend (Prisma Decimal.toJSON()),
// mas o schema de escrita espera number — dois tipos distintos para o
// compilador forçar a conversão (Number(...)) nos pontos certos.
export interface PlacementReward {
  id: string;
  placement: number;
  potPercentage: string;
  bonusPoints: number;
}

export interface PlacementRewardInput {
  placement: number;
  potPercentage: number;
  bonusPoints: number;
}

export interface TournamentDetail extends TournamentSummary {
  sponsors: Sponsor[];
  placementRewards: PlacementReward[];
}

export interface GetTournamentResponse {
  tournament: TournamentDetail;
}

export interface TournamentFormFields {
  name: string;
  gameId: string;
  description?: string;
  registrationStartAt: string;
  registrationEndAt: string;
  checkinDeadlineAt: string;
  eventStartAt: string;
  entryFeeCents: number;
  bracketType: BracketType;
  tiebreakerRule?: TiebreakerRule;
  pointsPerWin: number;
  pointsPerLoss: number;
  sponsors: SponsorInput[];
  placementRewards: PlacementRewardInput[];
}

export type CreateTournamentPayload = TournamentFormFields;

export interface UpdateTournamentPayload extends TournamentFormFields {
  status: TournamentStatus;
}
