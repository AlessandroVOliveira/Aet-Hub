import { apiRequest } from './http';
import type { GetMeResponse } from '@/types/auth';
import type { GetMyHistoryResponse, UpdateProfilePayload } from '@/types/profile';

export function updateMyProfile(
  token: string,
  payload: UpdateProfilePayload,
): Promise<GetMeResponse> {
  return apiRequest('/users/me', { method: 'PATCH', token, body: payload });
}

export function getMyHistory(token: string): Promise<GetMyHistoryResponse> {
  return apiRequest('/users/me/history', { method: 'GET', token });
}
