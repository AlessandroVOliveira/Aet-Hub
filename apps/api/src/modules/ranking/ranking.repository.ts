import type { Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

// Shape bruto retornado por `app_points_leaderboard()` (migration
// `points_leaderboard_function`) — SUM/RANK chegam como BigInt no driver,
// nunca number diretamente.
interface LeaderboardRow {
  user_id: string;
  username: string;
  display_name: string | null;
  points: bigint;
  position: bigint;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string | null;
  points: number;
  position: number;
}

export async function getLeaderboard(
  tx: Prisma.TransactionClient,
): Promise<LeaderboardEntry[]> {
  const rows = await tx.$queryRaw<LeaderboardRow[]>`SELECT * FROM app_points_leaderboard()`;

  // BigInt não serializa em JSON.stringify (TypeError) — converter aqui,
  // na borda do repository, antes de qualquer resposta HTTP.
  return rows.map((row) => ({
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    points: Number(row.points),
    position: Number(row.position),
  }));
}
