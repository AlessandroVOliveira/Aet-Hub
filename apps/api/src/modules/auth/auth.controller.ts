import type { Request, Response } from 'express';
import * as authService from './auth.service.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const user = await authService.register(req.body as RegisterInput);
  res.status(201).json({ user });
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body as LoginInput);
  res.status(200).json(result);
}

export function meHandler(req: Request, res: Response): void {
  res.status(200).json({ user: req.user });
}
