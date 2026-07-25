import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/require-role.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { createAchievementSchema, updateAchievementSchema } from './achievements.schemas.js';
import {
  createAchievementHandler,
  listActiveAchievementsHandler,
  listAllAchievementsHandler,
  updateAchievementHandler,
} from './achievements.controller.js';

export const achievementsRouter = Router();

achievementsRouter.use(requireAuth);

achievementsRouter.get('/', asyncHandler(listActiveAchievementsHandler));
achievementsRouter.get('/all', requireRole('ADMIN'), asyncHandler(listAllAchievementsHandler));
achievementsRouter.post(
  '/',
  requireRole('ADMIN'),
  validateBody(createAchievementSchema),
  asyncHandler(createAchievementHandler),
);
achievementsRouter.patch(
  '/:id',
  requireRole('ADMIN'),
  validateBody(updateAchievementSchema),
  asyncHandler(updateAchievementHandler),
);
