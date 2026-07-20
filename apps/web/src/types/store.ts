export interface StoreItem {
  id: string;
  name: string;
  description: string;
  costInCoins: number;
  stock: number | null;
  imageUrl: string | null;
  isActive: boolean;
  partnerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RedemptionStatus = 'PENDING' | 'FULFILLED' | 'CANCELLED';

export interface RedemptionStoreItemSummary {
  id: string;
  name: string;
  imageUrl: string | null;
  partnerName: string | null;
}

export interface Redemption {
  id: string;
  storeItemId: string;
  userId: string;
  costInCoins: number;
  status: RedemptionStatus;
  redeemedAt: string;
  fulfilledAt: string | null;
  createdAt: string;
  updatedAt: string;
  storeItem: RedemptionStoreItemSummary;
}

export interface GetStoreItemsResponse {
  items: StoreItem[];
}

export interface GetMyRedemptionsResponse {
  redemptions: Redemption[];
}

export interface CreateRedemptionPayload {
  storeItemId: string;
}

export interface CreateRedemptionResponse {
  redemption: Redemption;
}
