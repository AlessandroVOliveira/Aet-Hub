import type { Request, Response } from 'express';
import * as achievementsService from './achievements.service.js';
import type { CreateAchievementInput, UpdateAchievementInput } from './achievements.schemas.js';

export async function listActiveAchievementsHandler(req: Request, res: Response): Promise<void> {
  const achievements = await achievementsService.listActiveAchievements(req.user!);
  res.status(200).json({ achievements });
}

export async function listAllAchievementsHandler(req: Request, res: Response): Promise<void> {
  const achievements = await achievementsService.listAllAchievements(req.user!);
  res.status(200).json({ achievements });
}

export async function createAchievementHandler(req: Request, res: Response): Promise<void> {
  const achievement = await achievementsService.createAchievement(
    req.user!,
    req.body as CreateAchievementInput,
  );
  res.status(201).json({ achievement });
}

export async function updateAchievementHandler(req: Request, res: Response): Promise<void> {
  const achievement = await achievementsService.updateAchievement(
    req.user!,
    req.params.id as string,
    req.body as UpdateAchievementInput,
  );
  res.status(200).json({ achievement });
}
