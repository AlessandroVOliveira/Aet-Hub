import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/require-role.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { createTournamentSchema, updateTournamentSchema } from './tournaments.schemas.js';
import {
  createTournamentHandler,
  deleteTournamentHandler,
  getTournamentHandler,
  listTournamentsHandler,
  startTournamentHandler,
  updateTournamentHandler,
} from './tournaments.controller.js';

export const tournamentsRouter = Router();

// Toda a fatia é admin-only — listagem pública para players fica para a
// fatia de inscrição/checkin.
tournamentsRouter.use(requireAuth, requireRole('ADMIN'));

tournamentsRouter.post('/', validateBody(createTournamentSchema), asyncHandler(createTournamentHandler));
tournamentsRouter.get('/', asyncHandler(listTournamentsHandler));
tournamentsRouter.get('/:id', asyncHandler(getTournamentHandler));
tournamentsRouter.put(
  '/:id',
  validateBody(updateTournamentSchema),
  asyncHandler(updateTournamentHandler),
);
tournamentsRouter.delete('/:id', asyncHandler(deleteTournamentHandler));
tournamentsRouter.post('/:id/start', asyncHandler(startTournamentHandler));
