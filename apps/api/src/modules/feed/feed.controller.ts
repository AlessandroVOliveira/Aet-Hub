import type { Request, Response } from 'express';
import type { NewsCategory } from '@prisma/client';
import { AppError } from '../../utils/app-error.js';
import * as feedService from './feed.service.js';
import type { CreateNewsCommentInput } from './feed.schemas.js';

const VALID_CATEGORIES = new Set<NewsCategory>(['GENERAL', 'ESPORTS']);

function parseCategory(raw: unknown): NewsCategory {
  const category = raw ?? 'GENERAL';
  if (typeof category !== 'string' || !VALID_CATEGORIES.has(category as NewsCategory)) {
    throw new AppError('Categoria inválida', 400);
  }
  return category as NewsCategory;
}

function parseCursor(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

export async function listNewsHandler(req: Request, res: Response): Promise<void> {
  const category = parseCategory(req.query.category);
  const cursor = parseCursor(req.query.cursor);
  const page = await feedService.listNews(req.user!, category, cursor);
  res.status(200).json(page);
}

export async function listNewsCommentsHandler(req: Request, res: Response): Promise<void> {
  const comments = await feedService.listNewsComments(req.user!, req.params.newsItemId as string);
  res.status(200).json({ comments });
}

export async function createNewsCommentHandler(req: Request, res: Response): Promise<void> {
  const comment = await feedService.createNewsComment(
    req.user!,
    req.params.newsItemId as string,
    req.body as CreateNewsCommentInput,
  );
  res.status(201).json({ comment });
}

export async function deleteNewsCommentHandler(req: Request, res: Response): Promise<void> {
  await feedService.deleteNewsComment(req.user!, req.params.commentId as string);
  res.status(204).send();
}
