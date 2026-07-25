import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  followUserHandler,
  listFollowersHandler,
  listFollowingHandler,
  unfollowUserHandler,
} from './follows.controller.js';

export const followsRouter = Router();

followsRouter.use(requireAuth);

followsRouter.get('/following', asyncHandler(listFollowingHandler));
followsRouter.get('/followers', asyncHandler(listFollowersHandler));
followsRouter.post('/:userId', asyncHandler(followUserHandler));
followsRouter.delete('/:userId', asyncHandler(unfollowUserHandler));
