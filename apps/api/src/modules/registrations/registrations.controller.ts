import type { Request, Response } from 'express';
import * as registrationsService from './registrations.service.js';
import type { CreateRegistrationInput } from './registrations.schemas.js';

export async function listOpenTournamentsHandler(req: Request, res: Response): Promise<void> {
  const tournaments = await registrationsService.listOpenTournaments(req.user!);
  res.status(200).json({ tournaments });
}

export async function listMyRegistrationsHandler(req: Request, res: Response): Promise<void> {
  const registrations = await registrationsService.listMyRegistrations(req.user!);
  res.status(200).json({ registrations });
}

export async function createRegistrationHandler(req: Request, res: Response): Promise<void> {
  const registration = await registrationsService.registerForTournament(
    req.user!,
    req.body as CreateRegistrationInput,
  );
  res.status(201).json({ registration });
}

export async function cancelRegistrationHandler(req: Request, res: Response): Promise<void> {
  const registration = await registrationsService.cancelRegistration(
    req.user!,
    req.params.tournamentId as string,
  );
  res.status(200).json({ registration });
}
