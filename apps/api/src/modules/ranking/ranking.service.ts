import { withRls } from '../../config/rls.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as rankingRepository from './ranking.repository.js';

// Teto defensivo: nenhuma paginação real ainda (mesmo padrão de
// users.repository.ts#listPointsTransactions).
const LEADERBOARD_LIMIT = 100;

export async function getRanking(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const leaderboard = await rankingRepository.getLeaderboard(tx);
    const mine = leaderboard.find((entry) => entry.userId === actor.id);

    return {
      entries: leaderboard.slice(0, LEADERBOARD_LIMIT),
      totalPlayers: leaderboard.length,
      me: mine ? { position: mine.position, points: mine.points } : null,
    };
  });
}
