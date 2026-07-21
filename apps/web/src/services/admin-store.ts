import { apiRequest } from './http';
import type {
  CreateStoreItemPayload,
  GetAllRedemptionsResponse,
  GetAllStoreItemsResponse,
  GetRedemptionResponse,
  GetStoreItemResponse,
  RedemptionStatus,
  UpdateRedemptionStatusPayload,
  UpdateStoreItemPayload,
} from '@/types/store';

export function listAllStoreItems(token: string): Promise<GetAllStoreItemsResponse> {
  return apiRequest('/store/items/all', { method: 'GET', token });
}

export function createStoreItem(
  token: string,
  payload: CreateStoreItemPayload,
): Promise<GetStoreItemResponse> {
  return apiRequest('/store/items', { method: 'POST', token, body: payload });
}

export function updateStoreItem(
  token: string,
  id: string,
  payload: UpdateStoreItemPayload,
): Promise<GetStoreItemResponse> {
  return apiRequest(`/store/items/${id}`, { method: 'PATCH', token, body: payload });
}

export function listAllRedemptions(
  token: string,
  status?: RedemptionStatus,
): Promise<GetAllRedemptionsResponse> {
  const query = status ? `?status=${status}` : '';
  return apiRequest(`/store/redemptions${query}`, { method: 'GET', token });
}

export function updateRedemptionStatus(
  token: string,
  id: string,
  payload: UpdateRedemptionStatusPayload,
): Promise<GetRedemptionResponse> {
  return apiRequest(`/store/redemptions/${id}`, { method: 'PATCH', token, body: payload });
}
