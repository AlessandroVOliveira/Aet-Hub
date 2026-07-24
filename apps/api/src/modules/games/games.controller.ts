import type { Request, Response } from 'express';
import * as gamesService from './games.service.js';
import type { CreateGameInput, UpdateGameInput } from './games.schemas.js';

export async function listActiveGamesHandler(req: Request, res: Response): Promise<void> {
  const games = await gamesService.listActiveGames(req.user!);
  res.status(200).json({ games });
}

export async function listAllGamesHandler(req: Request, res: Response): Promise<void> {
  const games = await gamesService.listAllGames(req.user!);
  res.status(200).json({ games });
}

export async function createGameHandler(req: Request, res: Response): Promise<void> {
  const game = await gamesService.createGame(req.user!, req.body as CreateGameInput);
  res.status(201).json({ game });
}

export async function updateGameHandler(req: Request, res: Response): Promise<void> {
  const game = await gamesService.updateGame(
    req.user!,
    req.params.id as string,
    req.body as UpdateGameInput,
  );
  res.status(200).json({ game });
}
