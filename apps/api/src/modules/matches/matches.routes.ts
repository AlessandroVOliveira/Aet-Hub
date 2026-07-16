import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/require-role.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { recordMatchResultSchema } from './matches.schemas.js';
import { getBracketHandler, recordMatchResultHandler } from './matches.controller.js';

export const matchesRouter = Router();

matchesRouter.use(requireAuth);

matchesRouter.get('/tournaments/:tournamentId/bracket', asyncHandler(getBracketHandler));
matchesRouter.post(
  '/:id/result',
  requireRole('ADMIN'),
  validateBody(recordMatchResultSchema),
  asyncHandler(recordMatchResultHandler),
);
