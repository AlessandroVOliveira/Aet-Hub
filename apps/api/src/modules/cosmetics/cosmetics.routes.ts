import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/require-role.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  createCosmeticItemSchema,
  purchaseCosmeticItemSchema,
  updateCosmeticItemSchema,
  updateLoadoutSchema,
} from './cosmetics.schemas.js';
import {
  createCosmeticItemHandler,
  listAllCosmeticsHandler,
  listCosmeticsHandler,
  purchaseCosmeticItemHandler,
  updateCosmeticItemHandler,
  updateLoadoutHandler,
} from './cosmetics.controller.js';

export const cosmeticsRouter = Router();

cosmeticsRouter.use(requireAuth);

cosmeticsRouter.get('/', asyncHandler(listCosmeticsHandler));
cosmeticsRouter.get('/all', requireRole('ADMIN'), asyncHandler(listAllCosmeticsHandler));
cosmeticsRouter.post(
  '/',
  requireRole('ADMIN'),
  validateBody(createCosmeticItemSchema),
  asyncHandler(createCosmeticItemHandler),
);

// /loadout precisa vir ANTES de /:id — senão a rota parametrizada (admin
// update) engoliria PATCH /cosmetics/loadout tratando "loadout" como id.
cosmeticsRouter.patch(
  '/loadout',
  validateBody(updateLoadoutSchema),
  asyncHandler(updateLoadoutHandler),
);
cosmeticsRouter.patch(
  '/:id',
  requireRole('ADMIN'),
  validateBody(updateCosmeticItemSchema),
  asyncHandler(updateCosmeticItemHandler),
);

cosmeticsRouter.post(
  '/purchases',
  validateBody(purchaseCosmeticItemSchema),
  asyncHandler(purchaseCosmeticItemHandler),
);
