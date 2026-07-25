import type { Request, Response } from 'express';
import * as followsService from './follows.service.js';

export async function followUserHandler(req: Request, res: Response): Promise<void> {
  const follow = await followsService.followUser(req.user!, req.params.userId as string);
  res.status(201).json({ follow });
}

export async function unfollowUserHandler(req: Request, res: Response): Promise<void> {
  await followsService.unfollowUser(req.user!, req.params.userId as string);
  res.status(204).send();
}

export async function listFollowingHandler(req: Request, res: Response): Promise<void> {
  const following = await followsService.listMyFollowing(req.user!);
  res.status(200).json({ following });
}

export async function listFollowersHandler(req: Request, res: Response): Promise<void> {
  const followers = await followsService.listMyFollowers(req.user!);
  res.status(200).json({ followers });
}
