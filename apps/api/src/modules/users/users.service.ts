import { Prisma } from '@prisma/client';
import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import { recordAuditLog } from '../../utils/audit-log.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as matchesRepository from '../matches/matches.repository.js';
import * as registrationsRepository from '../registrations/registrations.repository.js';
import * as gamesRepository from '../games/games.repository.js';
import * as xpRepository from '../xp/xp.repository.js';
import { levelFromXp } from '../xp/xp-level-calculator.js';
import * as achievementsRepository from '../achievements/achievements.repository.js';
import * as cosmeticsRepository from '../cosmetics/cosmetics.repository.js';
import * as usersRepository from './users.repository.js';
import type {
  AdminUpdateUserInput,
  ModerateUserInput,
  UpdateProfileInput,
} from './users.schemas.js';

const PROFILE_FIELDS = [
  'displayName',
  'favoriteGameId',
  'favoriteCharacter',
  'theme',
  'avatarUrl',
  'bio',
] as const;

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

// RF-29 — própria progressão (nível/XP/conquistas), consumido por /perfil.
export async function getMyXp(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const [totalXp, achievements] = await Promise.all([
      xpRepository.getXpTotal(tx, actor.id),
      achievementsRepository.findUnlockedByUserId(tx, actor.id),
    ]);
    return { progress: levelFromXp(totalXp), achievements };
  });
}

// RF-29 — perfil público de terceiros (gap que RF-41 tinha deixado de
// propósito fora de escopo). 404 quando a função definer não devolve linha
// (usuário não existe, é ADMIN, está banido ou foi excluído — mesma
// semântica de "não existe" já usada em outros lugares do projeto).
export async function getPublicProfile(actor: AccessTokenPayload, targetUserId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const snapshot = await usersRepository.findPublicProfileSnapshot(tx, targetUserId);
    if (!snapshot) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Loadout (armário cosmético, fatia 1): a função definer só devolve os
    // ids equipados (bypassa RLS de profiles) — resolver nome/className/
    // raridade contra cosmetic_items é leitura comum, catálogo público sem
    // RLS pra se preocupar (diferente da travessia users/profiles acima).
    const cosmeticIds = [snapshot.equippedFrameId, snapshot.equippedTitleId].filter(
      (id): id is string => id !== null,
    );
    const [totalXp, achievements, followCounts, equippedCosmetics] = await Promise.all([
      xpRepository.getXpTotal(tx, targetUserId),
      achievementsRepository.findUnlockedByUserId(tx, targetUserId),
      usersRepository.findFollowCounts(tx, targetUserId),
      cosmeticsRepository.findCosmeticItemsByIds(tx, cosmeticIds),
    ]);
    const cosmeticById = new Map(equippedCosmetics.map((item) => [item.id, item]));

    const { equippedFrameId, equippedTitleId, ...publicFields } = snapshot;

    return {
      ...publicFields,
      progress: levelFromXp(totalXp),
      achievements,
      followersCount: followCounts.followersCount,
      followingCount: followCounts.followingCount,
      equippedFrame: equippedFrameId ? (cosmeticById.get(equippedFrameId) ?? null) : null,
      equippedTitle: equippedTitleId ? (cosmeticById.get(equippedTitleId) ?? null) : null,
    };
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
      // RF-16: soft delete/restauração reaproveitando a mesma infra de
      // ação administrativa reversível com motivo (ver adminUpdateUserSchema
      // para a edição de dados propriamente dita).
      ...(input.deleted !== undefined ? { deletedAt: input.deleted ? new Date() : null } : {}),
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
    if (input.deleted !== undefined && input.deleted !== (target.deletedAt !== null)) {
      await recordAuditLog(tx, {
        actorUserId: actor.id,
        action: input.deleted ? 'USER_DELETED' : 'USER_RESTORED',
        entityType: 'USER',
        entityId: targetUserId,
        metadata: { reason: input.reason },
      });
    }

    return updated;
  });
}

// RF-16 — edição de dados de players pelo admin (username/email de User +
// campos de Profile), com motivo obrigatório e diff completo no AuditLog
// (mesma convenção de "só loga o que realmente mudou" de moderateUser).
// Sem guard de auto-edição: diferente de moderateUser (banir/silenciar/
// excluir a própria conta é perigoso o bastante pra bloquear), editar o
// próprio username/perfil não é — o admin já pode fazer isso via /me.
export async function updateUserByAdmin(
  actor: AccessTokenPayload,
  targetUserId: string,
  input: AdminUpdateUserInput,
) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const target = await usersRepository.findUserById(tx, targetUserId);
    if (!target) {
      throw new AppError('Usuário não encontrado', 404);
    }

    if (input.favoriteGameId) {
      const game = await gamesRepository.findGameById(tx, input.favoriteGameId);
      if (!game) {
        throw new AppError('Jogo não encontrado', 404);
      }
    }

    const targetProfile = await usersRepository.findProfileByUserId(tx, targetUserId);

    const changes: Record<string, { from: string | null; to: string | null }> = {};
    if (input.username !== undefined && input.username !== target.username) {
      changes.username = { from: target.username, to: input.username };
    }
    if (input.email !== undefined && input.email !== target.email) {
      changes.email = { from: target.email, to: input.email };
    }
    for (const field of PROFILE_FIELDS) {
      const value = input[field];
      if (value !== undefined && value !== (targetProfile?.[field] ?? null)) {
        changes[field] = { from: targetProfile?.[field] ?? null, to: value };
      }
    }

    // Duas chamadas separadas (não uma só com os dois campos): sob a role
    // com RLS (aet_hub_app), o Postgres não devolve error.meta.target no
    // P2002 (só populado testado com a role owner) — em vez de depender
    // desse metadata pra saber qual campo colidiu, cada update isolado
    // garante que o P2002 pego no catch É sobre aquele campo específico.
    if (input.username !== undefined) {
      try {
        await usersRepository.updateUserAccountFields(tx, targetUserId, {
          username: input.username,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new AppError('Nome de usuário já está em uso', 409);
        }
        throw error;
      }
    }
    if (input.email !== undefined) {
      try {
        await usersRepository.updateUserAccountFields(tx, targetUserId, { email: input.email });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new AppError('E-mail já está em uso', 409);
        }
        throw error;
      }
    }

    const hasProfileChanges = PROFILE_FIELDS.some((field) => input[field] !== undefined);
    if (hasProfileChanges) {
      await usersRepository.updateProfile(tx, targetUserId, {
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(input.favoriteGameId !== undefined ? { favoriteGameId: input.favoriteGameId } : {}),
        ...(input.favoriteCharacter !== undefined
          ? { favoriteCharacter: input.favoriteCharacter }
          : {}),
        ...(input.theme !== undefined ? { theme: input.theme } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
      });
    }

    if (Object.keys(changes).length > 0) {
      await recordAuditLog(tx, {
        actorUserId: actor.id,
        action: 'USER_EDITED_BY_ADMIN',
        entityType: 'USER',
        entityId: targetUserId,
        metadata: { reason: input.reason, changes },
      });
    }

    return usersRepository.findUserForAdmin(tx, targetUserId);
  });
}
