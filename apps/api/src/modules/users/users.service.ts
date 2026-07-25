import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import { recordAuditLog } from '../../utils/audit-log.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as matchesRepository from '../matches/matches.repository.js';
import * as registrationsRepository from '../registrations/registrations.repository.js';
import * as gamesRepository from '../games/games.repository.js';
import * as usersRepository from './users.repository.js';
import type { ModerateUserInput, UpdateProfileInput } from './users.schemas.js';

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

export async function listAllUsers(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    usersRepository.listAllUsersForAdmin(tx),
  );
}

// RF-25 (Fatia B) — usada pela tela /admin/usuarios. A ação equivalente a
// partir da fila de denúncias fica em reports.service.ts (chama
// usersRepository diretamente dentro do próprio withRls, pra manter
// "moderar autor + resolver denúncia" atômico — ver CLAUDE.md).
export async function moderateUser(
  actor: AccessTokenPayload,
  targetUserId: string,
  input: ModerateUserInput,
) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    if (targetUserId === actor.id) {
      throw new AppError('Você não pode moderar sua própria conta', 400);
    }

    const target = await usersRepository.findUserById(tx, targetUserId);
    if (!target) {
      throw new AppError('Usuário não encontrado', 404);
    }

    const updated = await usersRepository.updateUserModeration(tx, targetUserId, {
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.isMuted !== undefined ? { isMuted: input.isMuted } : {}),
    });

    if (input.isActive !== undefined && input.isActive !== target.isActive) {
      await recordAuditLog(tx, {
        actorUserId: actor.id,
        action: input.isActive ? 'USER_UNBANNED' : 'USER_BANNED',
        entityType: 'USER',
        entityId: targetUserId,
        metadata: { reason: input.reason },
      });
    }
    if (input.isMuted !== undefined && input.isMuted !== target.isMuted) {
      await recordAuditLog(tx, {
        actorUserId: actor.id,
        action: input.isMuted ? 'USER_MUTED' : 'USER_UNMUTED',
        entityType: 'USER',
        entityId: targetUserId,
        metadata: { reason: input.reason },
      });
    }

    return updated;
  });
}
