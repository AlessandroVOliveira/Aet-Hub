import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/require-role.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { moderateUserSchema, updateProfileSchema } from './users.schemas.js';
import {
  getMyHistoryHandler,
  getMyProfileHandler,
  getMyWalletHandler,
  listAllUsersHandler,
  moderateUserHandler,
  updateMyProfileHandler,
} from './users.controller.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/me', asyncHandler(getMyProfileHandler));
usersRouter.patch('/me', validateBody(updateProfileSchema), asyncHandler(updateMyProfileHandler));
usersRouter.get('/me/history', asyncHandler(getMyHistoryHandler));
usersRouter.get('/me/points', asyncHandler(getMyWalletHandler));

// RF-25 (Fatia B) — tela /admin/usuarios.
usersRouter.get('/', requireRole('ADMIN'), asyncHandler(listAllUsersHandler));
usersRouter.patch(
  '/:id/moderation',
  requireRole('ADMIN'),
  validateBody(moderateUserSchema),
  asyncHandler(moderateUserHandler),
);
