import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/require-role.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  downloadTournamentPhotoHandler,
  listTournamentPhotosHandler,
  uploadTournamentPhotoHandler,
} from './tournament-photos.controller.js';
import { photoUpload } from './tournament-photos.storage.js';

export const tournamentPhotosRouter = Router();

tournamentPhotosRouter.use(requireAuth);

tournamentPhotosRouter.get('/tournaments/:tournamentId', asyncHandler(listTournamentPhotosHandler));
tournamentPhotosRouter.get('/:id/download', asyncHandler(downloadTournamentPhotoHandler));
tournamentPhotosRouter.post(
  '/tournaments/:tournamentId',
  requireRole('ADMIN'),
  photoUpload.single('photo'),
  asyncHandler(uploadTournamentPhotoHandler),
);
