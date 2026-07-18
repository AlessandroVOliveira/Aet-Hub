import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as tournamentsRepository from '../tournaments/tournaments.repository.js';
import * as tournamentPhotosRepository from './tournament-photos.repository.js';
import { UPLOAD_DIR, extensionForMimeType } from './tournament-photos.storage.js';

export async function uploadTournamentPhoto(
  actor: AccessTokenPayload,
  tournamentId: string,
  file: Express.Multer.File,
) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const tournament = await tournamentsRepository.findTournamentById(tx, tournamentId);
    if (!tournament) {
      throw new AppError('Torneio não encontrado', 404);
    }
    if (tournament.status !== 'COMPLETED') {
      throw new AppError('Só é possível anexar fotos depois que o torneio for encerrado', 409);
    }

    const extension = extensionForMimeType(file.mimetype)!; // já validado pelo fileFilter do multer
    const fileName = `${randomUUID()}${extension}`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, fileName), file.buffer);

    return tournamentPhotosRepository.createTournamentPhoto(tx, {
      tournamentId,
      uploadedByUserId: actor.id,
      fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
  });
}

export async function listTournamentPhotos(actor: AccessTokenPayload, tournamentId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const tournament = await tournamentsRepository.findTournamentById(tx, tournamentId);
    if (!tournament) {
      throw new AppError('Torneio não encontrado', 404);
    }
    return tournamentPhotosRepository.listTournamentPhotos(tx, tournamentId);
  });
}

export async function getTournamentPhotoFile(actor: AccessTokenPayload, photoId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const photo = await tournamentPhotosRepository.findTournamentPhotoById(tx, photoId);
    if (!photo) {
      throw new AppError('Foto não encontrada', 404);
    }
    return { photo, absolutePath: path.join(UPLOAD_DIR, photo.fileName) };
  });
}
