import type { Request, Response } from 'express';
import * as usersService from './users.service.js';
import type { UpdateProfileInput } from './users.schemas.js';

export async function getMyProfileHandler(req: Request, res: Response): Promise<void> {
  const profile = await usersService.getMyProfile(req.user!);
  res.status(200).json({ profile });
}

export async function updateMyProfileHandler(req: Request, res: Response): Promise<void> {
  const profile = await usersService.updateMyProfile(req.user!, req.body as UpdateProfileInput);
  res.status(200).json({ profile });
}

export async function listGamesHandler(req: Request, res: Response): Promise<void> {
  const games = await usersService.listGames(req.user!);
  res.status(200).json({ games });
}

export async function getMyHistoryHandler(req: Request, res: Response): Promise<void> {
  const history = await usersService.getMyHistory(req.user!);
  res.status(200).json(history);
}

export async function getMyWalletHandler(req: Request, res: Response): Promise<void> {
  const wallet = await usersService.getMyWallet(req.user!);
  res.status(200).json(wallet);
}
