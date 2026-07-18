import type { Request, Response } from 'express';
import { AppError } from '../../utils/app-error.js';
import * as tournamentPhotosService from './tournament-photos.service.js';

export async function uploadTournamentPhotoHandler(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new AppError('Envie um arquivo de foto', 400);
  }
  const photo = await tournamentPhotosService.uploadTournamentPhoto(
    req.user!,
    req.params.tournamentId as string,
    req.file,
  );
  res.status(201).json({ photo });
}

export async function listTournamentPhotosHandler(req: Request, res: Response): Promise<void> {
  const photos = await tournamentPhotosService.listTournamentPhotos(
    req.user!,
    req.params.tournamentId as string,
  );
  res.status(200).json({ photos });
}

export async function downloadTournamentPhotoHandler(req: Request, res: Response): Promise<void> {
  const { photo, absolutePath } = await tournamentPhotosService.getTournamentPhotoFile(
    req.user!,
    req.params.id as string,
  );
  res.download(absolutePath, photo.originalName, (err) => {
    // resposta já iniciada por res.download — não dá pra chamar next(err)
    // depois que os headers foram enviados.
    if (err) console.error(err);
  });
}
