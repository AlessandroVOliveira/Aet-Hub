import { apiRequest } from './http';
import type {
  GetCosmeticsResponse,
  PurchaseCosmeticItemPayload,
  UpdateLoadoutPayload,
} from '@/types/cosmetic';

export function listCosmetics(token: string): Promise<GetCosmeticsResponse> {
  return apiRequest('/cosmetics', { method: 'GET', token });
}

export function purchaseCosmeticItem(
  token: string,
  payload: PurchaseCosmeticItemPayload,
): Promise<unknown> {
  return apiRequest('/cosmetics/purchases', { method: 'POST', token, body: payload });
}

export function updateLoadout(token: string, payload: UpdateLoadoutPayload): Promise<unknown> {
  return apiRequest('/cosmetics/loadout', { method: 'PATCH', token, body: payload });
}
