import type { Request, Response } from 'express';
import * as tournamentsService from './tournaments.service.js';
import type { CreateTournamentInput, UpdateTournamentInput } from './tournaments.schemas.js';

export async function createTournamentHandler(req: Request, res: Response): Promise<void> {
  const tournament = await tournamentsService.createTournament(
    req.user!,
    req.body as CreateTournamentInput,
  );
  res.status(201).json({ tournament });
}

export async function listTournamentsHandler(req: Request, res: Response): Promise<void> {
  const tournaments = await tournamentsService.listTournaments(req.user!);
  res.status(200).json({ tournaments });
}

export async function getTournamentHandler(req: Request, res: Response): Promise<void> {
  // Params de rota vêm sempre como string simples aqui (rota é /:id, sem
  // regex de grupos repetidos) — os tipos do Express só admitem string[]
  // pelo caso geral de ParamsDictionary.
  const tournament = await tournamentsService.getTournamentById(req.user!, req.params.id as string);
  res.status(200).json({ tournament });
}

export async function updateTournamentHandler(req: Request, res: Response): Promise<void> {
  const tournament = await tournamentsService.updateTournament(
    req.user!,
    req.params.id as string,
    req.body as UpdateTournamentInput,
  );
  res.status(200).json({ tournament });
}

export async function deleteTournamentHandler(req: Request, res: Response): Promise<void> {
  await tournamentsService.deleteTournament(req.user!, req.params.id as string);
  res.status(204).send();
}

export async function startTournamentHandler(req: Request, res: Response): Promise<void> {
  const bracket = await tournamentsService.startTournament(req.user!, req.params.id as string);
  res.status(200).json({ bracket });
}

export async function completeTournamentHandler(req: Request, res: Response): Promise<void> {
  const result = await tournamentsService.completeTournament(req.user!, req.params.id as string);
  res.status(200).json(result);
}
