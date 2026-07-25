import type { Request, Response } from 'express';
import * as usersService from './users.service.js';
import type {
  AdminUpdateUserInput,
  ModerateUserInput,
  UpdateProfileInput,
} from './users.schemas.js';

export async function getMyProfileHandler(req: Request, res: Response): Promise<void> {
  const profile = await usersService.getMyProfile(req.user!);
  res.status(200).json({ profile });
}

export async function updateMyProfileHandler(req: Request, res: Response): Promise<void> {
  const profile = await usersService.updateMyProfile(req.user!, req.body as UpdateProfileInput);
  res.status(200).json({ profile });
}

export async function getMyHistoryHandler(req: Request, res: Response): Promise<void> {
  const history = await usersService.getMyHistory(req.user!);
  res.status(200).json(history);
}

export async function getMyWalletHandler(req: Request, res: Response): Promise<void> {
  const wallet = await usersService.getMyWallet(req.user!);
  res.status(200).json(wallet);
}

export async function getMyXpHandler(req: Request, res: Response): Promise<void> {
  const xp = await usersService.getMyXp(req.user!);
  res.status(200).json(xp);
}

export async function getPublicProfileHandler(req: Request, res: Response): Promise<void> {
  const profile = await usersService.getPublicProfile(req.user!, req.params.id as string);
  res.status(200).json({ profile });
}

export async function listAllUsersHandler(req: Request, res: Response): Promise<void> {
  const users = await usersService.listAllUsers(req.user!);
  res.status(200).json({ users });
}

export async function moderateUserHandler(req: Request, res: Response): Promise<void> {
  const user = await usersService.moderateUser(
    req.user!,
    req.params.id as string,
    req.body as ModerateUserInput,
  );
  res.status(200).json({ user });
}

export async function updateUserByAdminHandler(req: Request, res: Response): Promise<void> {
  const user = await usersService.updateUserByAdmin(
    req.user!,
    req.params.id as string,
    req.body as AdminUpdateUserInput,
  );
  res.status(200).json({ user });
}
