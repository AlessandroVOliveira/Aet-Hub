import { apiRequest } from './http';
import type {
  CreateRedemptionPayload,
  CreateRedemptionResponse,
  GetMyRedemptionsResponse,
  GetStoreItemsResponse,
} from '@/types/store';

export function listActiveStoreItems(token: string): Promise<GetStoreItemsResponse> {
  return apiRequest('/store/items', { method: 'GET', token });
}

export function listMyRedemptions(token: string): Promise<GetMyRedemptionsResponse> {
  return apiRequest('/store/redemptions/me', { method: 'GET', token });
}

export function redeemStoreItem(
  token: string,
  payload: CreateRedemptionPayload,
): Promise<CreateRedemptionResponse> {
  return apiRequest('/store/redemptions', { method: 'POST', token, body: payload });
}
