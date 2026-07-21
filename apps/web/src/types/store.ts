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

export interface RedemptionUserSummary {
  id: string;
  username: string;
  profile: { displayName: string } | null;
}

export interface RedemptionWithUser extends Redemption {
  user: RedemptionUserSummary;
}

export interface GetAllStoreItemsResponse {
  items: StoreItem[];
}

export interface GetAllRedemptionsResponse {
  redemptions: RedemptionWithUser[];
}

export interface StoreItemFormFields {
  name: string;
  description: string;
  costInCoins: number;
  stock?: number | null;
  imageUrl?: string;
  partnerName?: string;
  isActive?: boolean;
}

export type CreateStoreItemPayload = StoreItemFormFields;
export type UpdateStoreItemPayload = Partial<StoreItemFormFields>;

export interface UpdateRedemptionStatusPayload {
  status: 'FULFILLED' | 'CANCELLED';
}

export interface GetStoreItemResponse {
  item: StoreItem;
}

export interface GetRedemptionResponse {
  redemption: Redemption;
}
