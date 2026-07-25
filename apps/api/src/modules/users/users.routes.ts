import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/require-role.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { adminUpdateUserSchema, moderateUserSchema, updateProfileSchema } from './users.schemas.js';
import {
  getMyHistoryHandler,
  getMyProfileHandler,
  getMyWalletHandler,
  getMyXpHandler,
  getPublicProfileHandler,
  listAllUsersHandler,
  moderateUserHandler,
  updateMyProfileHandler,
  updateUserByAdminHandler,
} from './users.controller.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/me', asyncHandler(getMyProfileHandler));
usersRouter.patch('/me', validateBody(updateProfileSchema), asyncHandler(updateMyProfileHandler));
usersRouter.get('/me/history', asyncHandler(getMyHistoryHandler));
usersRouter.get('/me/points', asyncHandler(getMyWalletHandler));
usersRouter.get('/me/xp', asyncHandler(getMyXpHandler));

// RF-29 — perfil público de terceiros (qualquer autenticado, não só ADMIN).
usersRouter.get('/:id/public', asyncHandler(getPublicProfileHandler));

// RF-25 (Fatia B) — tela /admin/usuarios.
usersRouter.get('/', requireRole('ADMIN'), asyncHandler(listAllUsersHandler));
usersRouter.patch(
  '/:id/moderation',
  requireRole('ADMIN'),
  validateBody(moderateUserSchema),
  asyncHandler(moderateUserHandler),
);
// RF-16 — edição de dados de players pelo admin (username/e-mail/Profile).
usersRouter.patch(
  '/:id',
  requireRole('ADMIN'),
  validateBody(adminUpdateUserSchema),
  asyncHandler(updateUserByAdminHandler),
);
