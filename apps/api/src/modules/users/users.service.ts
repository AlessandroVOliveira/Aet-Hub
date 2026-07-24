import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as matchesRepository from '../matches/matches.repository.js';
import * as registrationsRepository from '../registrations/registrations.repository.js';
import * as gamesRepository from '../games/games.repository.js';
import * as usersRepository from './users.repository.js';
import type { UpdateProfileInput } from './users.schemas.js';

export async function getMyProfile(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const profile = await usersRepository.findProfileByUserId(tx, actor.id);
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }
    return profile;
  });
}

export async function updateMyProfile(actor: AccessTokenPayload, input: UpdateProfileInput) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    if (input.favoriteGameId) {
      const game = await gamesRepository.findGameById(tx, input.favoriteGameId);
      if (!game) {
        throw new AppError('Jogo não encontrado', 404);
      }
    }
    return usersRepository.updateProfile(tx, actor.id, input);
  });
}

function toMatchHistoryEntry(
  match: Awaited<ReturnType<typeof matchesRepository.findMatchesByUserId>>[number],
  userId: string,
) {
  const isSeatA = match.registrationA?.user.id === userId;
  const me = isSeatA ? match.registrationA : match.registrationB;
  const opponent = isSeatA ? match.registrationB : match.registrationA;

  return {
    matchId: match.id,
    tournamentId: match.tournament.id,
    tournamentName: match.tournament.name,
    opponent: opponent
      ? {
          username: opponent.user.username,
          displayName: opponent.user.profile?.displayName ?? null,
        }
      : null,
    result: match.winnerRegistrationId === me?.id ? 'WIN' : 'LOSS',
    scoreSelf: isSeatA ? match.scoreA : match.scoreB,
    scoreOpponent: isSeatA ? match.scoreB : match.scoreA,
    playedAt: match.playedAt,
  } as const;
}

export async function getMyHistory(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const [registrations, matches] = await Promise.all([
      registrationsRepository.listMyRegistrations(tx, actor.id),
      matchesRepository.findMatchesByUserId(tx, actor.id),
    ]);
    return {
      registrations,
      matches: matches.map((match) => toMatchHistoryEntry(match, actor.id)),
    };
  });
}

export async function getMyWallet(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const [balance, transactions] = await Promise.all([
      usersRepository.getPointsBalance(tx, actor.id),
      usersRepository.listPointsTransactions(tx, actor.id),
    ]);
    return { balance, transactions };
  });
}
