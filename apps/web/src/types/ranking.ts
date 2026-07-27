import type { CosmeticRarity } from './cosmetic';

export interface RankingEntry {
  userId: string;
  username: string;
  displayName: string | null;
  points: number;
  position: number;
  frame: { className: string | null } | null;
  title: { name: string; rarity: CosmeticRarity } | null;
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
