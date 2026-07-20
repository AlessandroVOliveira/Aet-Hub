export type PointsTransactionType =
  | 'MATCH_WIN'
  | 'MATCH_LOSS'
  | 'PLACEMENT'
  | 'BONUS'
  | 'REDEMPTION'
  | 'ADJUSTMENT';

export interface PointsTransaction {
  id: string;
  userId: string;
  type: PointsTransactionType;
  amount: number;
  tournamentId: string | null;
  matchId: string | null;
  redemptionId: string | null;
  description: string;
  createdAt: string;
}

export interface GetMyWalletResponse {
  balance: number;
  transactions: PointsTransaction[];
}
