import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { updateProfileSchema } from './users.schemas.js';
import {
  getMyHistoryHandler,
  getMyProfileHandler,
  getMyWalletHandler,
  listGamesHandler,
  updateMyProfileHandler,
} from './users.controller.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/me', asyncHandler(getMyProfileHandler));
usersRouter.patch('/me', validateBody(updateProfileSchema), asyncHandler(updateMyProfileHandler));
usersRouter.get('/me/history', asyncHandler(getMyHistoryHandler));
usersRouter.get('/me/points', asyncHandler(getMyWalletHandler));
usersRouter.get('/games', asyncHandler(listGamesHandler));
