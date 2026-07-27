import type { Request, Response } from 'express';
import { CosmeticKind } from '@prisma/client';
import * as cosmeticsService from './cosmetics.service.js';
import type {
  CreateCosmeticItemInput,
  PurchaseCosmeticItemInput,
  UpdateCosmeticItemInput,
  UpdateLoadoutInput,
} from './cosmetics.schemas.js';

const VALID_KINDS = new Set(Object.values(CosmeticKind));

function parseKindQuery(raw: unknown): CosmeticKind | undefined {
  return typeof raw === 'string' && VALID_KINDS.has(raw as CosmeticKind)
    ? (raw as CosmeticKind)
    : undefined;
}

export async function listCosmeticsHandler(req: Request, res: Response): Promise<void> {
  const result = await cosmeticsService.listCosmetics(req.user!, parseKindQuery(req.query.kind));
  res.status(200).json(result);
}

export async function listAllCosmeticsHandler(req: Request, res: Response): Promise<void> {
  const items = await cosmeticsService.listAllCosmetics(req.user!);
  res.status(200).json({ items });
}

export async function createCosmeticItemHandler(req: Request, res: Response): Promise<void> {
  const item = await cosmeticsService.createCosmeticItem(
    req.user!,
    req.body as CreateCosmeticItemInput,
  );
  res.status(201).json({ item });
}

export async function updateCosmeticItemHandler(req: Request, res: Response): Promise<void> {
  const item = await cosmeticsService.updateCosmeticItem(
    req.user!,
    req.params.id as string,
    req.body as UpdateCosmeticItemInput,
  );
  res.status(200).json({ item });
}

export async function purchaseCosmeticItemHandler(req: Request, res: Response): Promise<void> {
  const ownership = await cosmeticsService.purchaseCosmeticItem(
    req.user!,
    req.body as PurchaseCosmeticItemInput,
  );
  res.status(201).json({ ownership });
}

export async function updateLoadoutHandler(req: Request, res: Response): Promise<void> {
  const profile = await cosmeticsService.updateLoadout(req.user!, req.body as UpdateLoadoutInput);
  res.status(200).json({ profile });
}
