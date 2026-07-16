import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/require-role.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { createCheckinSchema } from './checkin.schemas.js';
import { createCheckinHandler, listTournamentCheckinsHandler } from './checkin.controller.js';

export const checkinRouter = Router();

checkinRouter.use(requireAuth, requireRole('ADMIN'));

checkinRouter.post('/', validateBody(createCheckinSchema), asyncHandler(createCheckinHandler));
checkinRouter.get('/tournaments/:tournamentId', asyncHandler(listTournamentCheckinsHandler));
