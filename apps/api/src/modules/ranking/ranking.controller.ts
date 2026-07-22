import type { Request, Response } from 'express';
import * as rankingService from './ranking.service.js';

export async function getRankingHandler(req: Request, res: Response): Promise<void> {
  const ranking = await rankingService.getRanking(req.user!);
  res.status(200).json(ranking);
}
