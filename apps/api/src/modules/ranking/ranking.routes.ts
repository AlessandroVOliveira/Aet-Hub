import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { getRankingHandler } from './ranking.controller.js';

export const rankingRouter = Router();

rankingRouter.use(requireAuth);

rankingRouter.get('/', asyncHandler(getRankingHandler));
