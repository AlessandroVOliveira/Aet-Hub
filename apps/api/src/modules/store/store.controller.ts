import type { Request, Response } from 'express';
import { RedemptionStatus } from '@prisma/client';
import * as storeService from './store.service.js';
import type {
  CreateStoreItemInput,
  RedeemStoreItemInput,
  UpdateRedemptionStatusInput,
  UpdateStoreItemInput,
} from './store.schemas.js';

export async function createStoreItemHandler(req: Request, res: Response): Promise<void> {
  const item = await storeService.createStoreItem(req.user!, req.body as CreateStoreItemInput);
  res.status(201).json({ item });
}

export async function listActiveStoreItemsHandler(req: Request, res: Response): Promise<void> {
  const items = await storeService.listActiveStoreItems(req.user!);
  res.status(200).json({ items });
}

export async function listAllStoreItemsHandler(req: Request, res: Response): Promise<void> {
  const items = await storeService.listAllStoreItems(req.user!);
  res.status(200).json({ items });
}

export async function updateStoreItemHandler(req: Request, res: Response): Promise<void> {
  const item = await storeService.updateStoreItem(
    req.user!,
    req.params.id as string,
    req.body as UpdateStoreItemInput,
  );
  res.status(200).json({ item });
}

export async function redeemStoreItemHandler(req: Request, res: Response): Promise<void> {
  const redemption = await storeService.redeemStoreItem(
    req.user!,
    req.body as RedeemStoreItemInput,
  );
  res.status(201).json({ redemption });
}

export async function listMyRedemptionsHandler(req: Request, res: Response): Promise<void> {
  const redemptions = await storeService.listMyRedemptions(req.user!);
  res.status(200).json({ redemptions });
}

const VALID_REDEMPTION_STATUSES = new Set(Object.values(RedemptionStatus));

export async function listAllRedemptionsHandler(req: Request, res: Response): Promise<void> {
  const rawStatus = req.query.status;
  const status =
    typeof rawStatus === 'string' && VALID_REDEMPTION_STATUSES.has(rawStatus as RedemptionStatus)
      ? (rawStatus as RedemptionStatus)
      : undefined;
  const redemptions = await storeService.listAllRedemptions(req.user!, status);
  res.status(200).json({ redemptions });
}

export async function updateRedemptionStatusHandler(req: Request, res: Response): Promise<void> {
  const redemption = await storeService.updateRedemptionStatus(
    req.user!,
    req.params.id as string,
    req.body as UpdateRedemptionStatusInput,
  );
  res.status(200).json({ redemption });
}
