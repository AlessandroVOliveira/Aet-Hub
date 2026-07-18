import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/require-role.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  createStoreItemSchema,
  redeemStoreItemSchema,
  updateRedemptionStatusSchema,
  updateStoreItemSchema,
} from './store.schemas.js';
import {
  createStoreItemHandler,
  listActiveStoreItemsHandler,
  listAllRedemptionsHandler,
  listAllStoreItemsHandler,
  listMyRedemptionsHandler,
  redeemStoreItemHandler,
  updateRedemptionStatusHandler,
  updateStoreItemHandler,
} from './store.controller.js';

export const storeRouter = Router();

storeRouter.use(requireAuth);

storeRouter.get('/items', asyncHandler(listActiveStoreItemsHandler));
storeRouter.get('/items/all', requireRole('ADMIN'), asyncHandler(listAllStoreItemsHandler));
storeRouter.post(
  '/items',
  requireRole('ADMIN'),
  validateBody(createStoreItemSchema),
  asyncHandler(createStoreItemHandler),
);
storeRouter.patch(
  '/items/:id',
  requireRole('ADMIN'),
  validateBody(updateStoreItemSchema),
  asyncHandler(updateStoreItemHandler),
);

storeRouter.post(
  '/redemptions',
  validateBody(redeemStoreItemSchema),
  asyncHandler(redeemStoreItemHandler),
);
storeRouter.get('/redemptions/me', asyncHandler(listMyRedemptionsHandler));
storeRouter.get('/redemptions', requireRole('ADMIN'), asyncHandler(listAllRedemptionsHandler));
storeRouter.patch(
  '/redemptions/:id',
  requireRole('ADMIN'),
  validateBody(updateRedemptionStatusSchema),
  asyncHandler(updateRedemptionStatusHandler),
);
