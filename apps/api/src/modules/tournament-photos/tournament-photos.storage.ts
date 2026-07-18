import path from 'node:path';
import multer from 'multer';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

export const UPLOAD_DIR = path.resolve(process.cwd(), env.UPLOAD_DIR);
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export function extensionForMimeType(mimeType: string): string | undefined {
  return ALLOWED_MIME_TYPES[mimeType];
}

// memoryStorage (não diskStorage): só grava em disco depois que o service
// validar a regra de negócio (torneio precisa estar COMPLETED) — evita
// limpar arquivo órfão em disco em caso de rejeição.
export const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      callback(new AppError('Formato de arquivo não suportado — envie JPEG, PNG ou WEBP', 400));
      return;
    }
    callback(null, true);
  },
});
