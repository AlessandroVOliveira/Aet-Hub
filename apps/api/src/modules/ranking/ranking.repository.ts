import type { CosmeticRarity, Prisma } from '@prisma/client';
import * as cosmeticsRepository from '../cosmetics/cosmetics.repository.js';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

// Shape bruto retornado por `app_points_leaderboard()` (migration
// `points_leaderboard_function`, estendida em `points_leaderboard_loadout`
// com o loadout equipado — fatia 2 do armário cosmético) — SUM/RANK chegam
// como BigInt no driver, nunca number diretamente.
interface LeaderboardRow {
  user_id: string;
  username: string;
  display_name: string | null;
  points: bigint;
  position: bigint;
  equipped_frame_id: string | null;
  equipped_title_id: string | null;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string | null;
  points: number;
  position: number;
  frame: { className: string | null } | null;
  title: { name: string; rarity: CosmeticRarity } | null;
}

export async function getLeaderboard(
  tx: Prisma.TransactionClient,
): Promise<LeaderboardEntry[]> {
  const rows = await tx.$queryRaw<LeaderboardRow[]>`SELECT * FROM app_points_leaderboard()`;

  // Só os ids voltam da função definer — resolver nome/className/rarity
  // contra cosmetic_items (catálogo público, sem RLS pra se preocupar)
  // numa única chamada em lote, mesmo helper já usado por
  // users.service.ts#getPublicProfile.
  const cosmeticIds = [
    ...new Set(
      rows.flatMap((row) => [row.equipped_frame_id, row.equipped_title_id]).filter(
        (id): id is string => id !== null,
      ),
    ),
  ];
  const cosmeticItems = await cosmeticsRepository.findCosmeticItemsByIds(tx, cosmeticIds);
  const cosmeticById = new Map(cosmeticItems.map((item) => [item.id, item]));

  // BigInt não serializa em JSON.stringify (TypeError) — converter aqui,
  // na borda do repository, antes de qualquer resposta HTTP.
  return rows.map((row) => {
    const frame = row.equipped_frame_id ? cosmeticById.get(row.equipped_frame_id) : undefined;
    const title = row.equipped_title_id ? cosmeticById.get(row.equipped_title_id) : undefined;
    return {
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name,
      points: Number(row.points),
      position: Number(row.position),
      frame: frame ? { className: frame.className } : null,
      title: title ? { name: title.name, rarity: title.rarity } : null,
    };
  });
}
