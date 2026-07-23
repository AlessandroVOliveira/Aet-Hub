import { withRls } from '../../config/rls.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as notificationsRepository from './notifications.repository.js';

export async function listMyNotifications(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const [notifications, unreadCount] = await Promise.all([
      notificationsRepository.listNotifications(tx, actor.id),
      notificationsRepository.countUnread(tx, actor.id),
    ]);
    return { notifications, unreadCount };
  });
}

export async function markAllAsRead(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const { count } = await notificationsRepository.markAllRead(tx, actor.id);
    return { updatedCount: count };
  });
}
