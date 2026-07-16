import type { Request, Response } from 'express';
import * as checkinService from './checkin.service.js';
import type { CreateCheckinInput } from './checkin.schemas.js';

export async function createCheckinHandler(req: Request, res: Response): Promise<void> {
  const checkin = await checkinService.checkinRegistration(req.user!, req.body as CreateCheckinInput);
  res.status(201).json({ checkin });
}

export async function listTournamentCheckinsHandler(req: Request, res: Response): Promise<void> {
  const registrations = await checkinService.listTournamentCheckins(
    req.user!,
    req.params.tournamentId as string,
  );
  res.status(200).json({ registrations });
}
