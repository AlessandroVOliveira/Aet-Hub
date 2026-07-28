import type { CosmeticRarity } from './cosmetic';

export interface RankingEntry {
  userId: string;
  username: string;
  displayName: string | null;
  points: number;
  position: number;
  frame: { className: string | null } | null;
  title: { name: string; rarity: CosmeticRarity } | null;
  // Armário cosmético (fatia 3) — só fonte, sem mascote (ranking usa
  // PlayerBadge, avatar compacto de 24px, escala pequena demais pro emoji
  // do mascote; mascote fica restrito a /perfil e /perfil/:userId).
  font: { className: string | null } | null;
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
