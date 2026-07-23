import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  listMyNotificationsHandler,
  markAllNotificationsReadHandler,
} from './notifications.controller.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// Sem body/params — sem zod, sem rate limiter próprio (criação não é rota
// HTTP; o único caminho de escrita é a função SQL app_create_notification,
// chamada pelos services de outros módulos).
notificationsRouter.get('/', asyncHandler(listMyNotificationsHandler));
notificationsRouter.post('/read', asyncHandler(markAllNotificationsReadHandler));
