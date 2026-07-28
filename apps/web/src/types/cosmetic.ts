export type CosmeticKind = 'FRAME' | 'BANNER' | 'TITLE' | 'FONT' | 'EFFECT' | 'MASCOT';
export type CosmeticRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface CosmeticItem {
  id: string;
  kind: CosmeticKind;
  name: string;
  description: string;
  rarity: CosmeticRarity;
  priceInPoints: number;
  className: string | null;
  // Sprite do mascote (emoji) — só usado em kind MASCOT.
  emoji: string | null;
  unlockAchievementCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Só devolvido por GET /cosmetics (catálogo ativo anotado pro usuário da
// sessão) — GET /cosmetics/all (admin) devolve CosmeticItem cru, sem posse.
export interface OwnedCosmeticItem extends CosmeticItem {
  owned: boolean;
  lockedReason: string | null;
}

export interface CosmeticLoadout {
  frameId: string | null;
  titleId: string | null;
  fontId: string | null;
  mascotId: string | null;
}

export interface GetCosmeticsResponse {
  items: OwnedCosmeticItem[];
  loadout: CosmeticLoadout;
}

export interface GetAllCosmeticsResponse {
  items: CosmeticItem[];
}

export interface GetCosmeticItemResponse {
  item: CosmeticItem;
}

export interface CosmeticItemFormFields {
  kind: CosmeticKind;
  name: string;
  description: string;
  rarity: CosmeticRarity;
  priceInPoints: number;
  className?: string;
  emoji?: string;
  unlockAchievementCode?: string;
  isActive: boolean;
}

export type CreateCosmeticItemPayload = CosmeticItemFormFields;
export type UpdateCosmeticItemPayload = Partial<CosmeticItemFormFields>;

export interface PurchaseCosmeticItemPayload {
  cosmeticItemId: string;
}

// null explícito desequipa o slot; campo ausente deixa como está.
export interface UpdateLoadoutPayload {
  frameId?: string | null;
  titleId?: string | null;
  fontId?: string | null;
  mascotId?: string | null;
}
