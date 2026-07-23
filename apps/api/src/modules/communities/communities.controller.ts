import type { Request, Response } from 'express';
import * as communitiesService from './communities.service.js';
import type { CreateCommunityInput, UpdateCommunityInput } from './communities.schemas.js';

export async function listCommunitiesHandler(req: Request, res: Response): Promise<void> {
  const communities = await communitiesService.listCommunities(req.user!);
  res.status(200).json({ communities });
}

export async function listAllCommunitiesHandler(req: Request, res: Response): Promise<void> {
  const communities = await communitiesService.listAllCommunities(req.user!);
  res.status(200).json({ communities });
}

export async function getCommunityHandler(req: Request, res: Response): Promise<void> {
  const community = await communitiesService.getCommunity(req.user!, req.params.id as string);
  res.status(200).json({ community });
}

export async function createCommunityHandler(req: Request, res: Response): Promise<void> {
  const community = await communitiesService.createCommunity(
    req.user!,
    req.body as CreateCommunityInput,
  );
  res.status(201).json({ community });
}

export async function updateCommunityHandler(req: Request, res: Response): Promise<void> {
  const community = await communitiesService.updateCommunity(
    req.user!,
    req.params.id as string,
    req.body as UpdateCommunityInput,
  );
  res.status(200).json({ community });
}
