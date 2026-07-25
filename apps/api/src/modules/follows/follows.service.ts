import { Prisma } from '@prisma/client';
import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import { findProfileByUserId } from '../users/users.repository.js';
import { findRecipientDisplayName } from '../chat/direct-messages.repository.js';
import * as notificationsRepository from '../notifications/notifications.repository.js';
import { emitNewNotification } from '../notifications/notifications.emitter.js';
import * as followsRepository from './follows.repository.js';

export async function followUser(actor: AccessTokenPayload, targetUserId: string) {
  if (targetUserId === actor.id) {
    throw new AppError('Você não pode seguir a si mesmo', 400);
  }

  const { follow, notification } = await withRls(
    { userId: actor.id, role: actor.role },
    async (tx) => {
      // users/profiles não são visíveis entre players sem torneio em
      // comum (RLS é self/ADMIN/colega-de-torneio) — reaproveita a mesma
      // função SECURITY DEFINER que a DM já usa pra resolver o nome do
      // destinatário através dessa fronteira.
      const followingDisplayName = await findRecipientDisplayName(tx, targetUserId);
      if (!followingDisplayName) {
        throw new AppError('Player não encontrado', 404);
      }

      const followerProfile = await findProfileByUserId(tx, actor.id);
      if (!followerProfile) {
        throw new AppError('Perfil não encontrado', 404);
      }

      let createdFollow;
      try {
        createdFollow = await followsRepository.createFollow(tx, {
          followerId: actor.id,
          followingId: targetUserId,
          followerDisplayName: followerProfile.displayName,
          followingDisplayName,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new AppError('Você já segue este player', 409);
        }
        throw error;
      }

      const createdNotification = await notificationsRepository.createNotification(tx, {
        userId: targetUserId,
        type: 'FOLLOWED',
        title: 'Novo seguidor',
        body: `${createdFollow.followerDisplayName} passou a seguir você`,
        linkPath: '/perfil',
        refId: createdFollow.id,
      });

      return { follow: createdFollow, notification: createdNotification };
    },
  );

  // Sempre pós-commit — nunca de dentro do withRls (padrão consolidado no
  // projeto, ver notifications.emitter.ts).
  emitNewNotification(notification);

  return follow;
}

export async function unfollowUser(actor: AccessTokenPayload, targetUserId: string) {
  const removed = await withRls({ userId: actor.id, role: actor.role }, (tx) =>
    followsRepository.deleteFollow(tx, actor.id, targetUserId),
  );

  if (!removed) {
    throw new AppError('Você não segue este player', 404);
  }
}

export async function listMyFollowing(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    followsRepository.listFollowing(tx, actor.id),
  );
}

export async function listMyFollowers(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    followsRepository.listFollowers(tx, actor.id),
  );
}
