export interface RankingEntry {
  userId: string;
  username: string;
  displayName: string | null;
  points: number;
  position: number;
}

export interface RankingMe {
  position: number;
  points: number;
}

export interface GetRankingResponse {
  entries: RankingEntry[];
  totalPlayers: number;
  me: RankingMe | null;
}
