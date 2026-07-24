import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/require-role.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { createGameSchema, updateGameSchema } from './games.schemas.js';
import {
  createGameHandler,
  listActiveGamesHandler,
  listAllGamesHandler,
  updateGameHandler,
} from './games.controller.js';

export const gamesRouter = Router();

gamesRouter.use(requireAuth);

gamesRouter.get('/', asyncHandler(listActiveGamesHandler));
gamesRouter.get('/all', requireRole('ADMIN'), asyncHandler(listAllGamesHandler));
gamesRouter.post(
  '/',
  requireRole('ADMIN'),
  validateBody(createGameSchema),
  asyncHandler(createGameHandler),
);
gamesRouter.patch(
  '/:id',
  requireRole('ADMIN'),
  validateBody(updateGameSchema),
  asyncHandler(updateGameHandler),
);
