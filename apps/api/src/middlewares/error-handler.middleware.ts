import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ message: 'Dados inválidos', issues: err.issues });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Arquivo muito grande — o limite é de 5MB'
        : 'Erro ao processar o arquivo enviado';
    res.status(400).json({ message });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Erro interno' });
}
