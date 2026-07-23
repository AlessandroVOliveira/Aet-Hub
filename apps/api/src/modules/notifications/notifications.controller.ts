import type { Request, Response } from 'express';
import * as notificationsService from './notifications.service.js';

export async function listMyNotificationsHandler(req: Request, res: Response): Promise<void> {
  const { notifications, unreadCount } = await notificationsService.listMyNotifications(
    req.user!,
  );
  res.status(200).json({ notifications, unreadCount });
}

export async function markAllNotificationsReadHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const { updatedCount } = await notificationsService.markAllAsRead(req.user!);
  res.status(200).json({ updatedCount });
}
