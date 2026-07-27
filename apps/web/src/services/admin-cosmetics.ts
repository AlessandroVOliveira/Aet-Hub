import { apiRequest } from './http';
import type {
  CreateCosmeticItemPayload,
  GetAllCosmeticsResponse,
  GetCosmeticItemResponse,
  UpdateCosmeticItemPayload,
} from '@/types/cosmetic';

export function listAllCosmetics(token: string): Promise<GetAllCosmeticsResponse> {
  return apiRequest('/cosmetics/all', { method: 'GET', token });
}

export function createCosmeticItem(
  token: string,
  payload: CreateCosmeticItemPayload,
): Promise<GetCosmeticItemResponse> {
  return apiRequest('/cosmetics', { method: 'POST', token, body: payload });
}

export function updateCosmeticItem(
  token: string,
  id: string,
  payload: UpdateCosmeticItemPayload,
): Promise<GetCosmeticItemResponse> {
  return apiRequest(`/cosmetics/${id}`, { method: 'PATCH', token, body: payload });
}
