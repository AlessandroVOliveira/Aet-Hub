import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { createRegistrationSchema } from './registrations.schemas.js';
import {
  cancelRegistrationHandler,
  createRegistrationHandler,
  listMyRegistrationsHandler,
  listOpenTournamentsHandler,
} from './registrations.controller.js';

export const registrationsRouter = Router();

registrationsRouter.use(requireAuth);

registrationsRouter.get('/tournaments', asyncHandler(listOpenTournamentsHandler));
registrationsRouter.get('/me', asyncHandler(listMyRegistrationsHandler));
registrationsRouter.post(
  '/',
  validateBody(createRegistrationSchema),
  asyncHandler(createRegistrationHandler),
);
registrationsRouter.post('/:tournamentId/cancel', asyncHandler(cancelRegistrationHandler));
