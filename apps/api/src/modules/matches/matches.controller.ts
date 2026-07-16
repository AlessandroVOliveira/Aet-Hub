import type { Request, Response } from 'express';
import * as matchesService from './matches.service.js';
import type { RecordMatchResultInput } from './matches.schemas.js';

export async function getBracketHandler(req: Request, res: Response): Promise<void> {
  const bracket = await matchesService.getBracket(req.user!, req.params.tournamentId as string);
  res.status(200).json({ bracket });
}

export async function recordMatchResultHandler(req: Request, res: Response): Promise<void> {
  const match = await matchesService.recordMatchResult(
    req.user!,
    req.params.id as string,
    req.body as RecordMatchResultInput,
  );
  res.status(200).json({ match });
}
