import { apiRequest } from './http';
import type { GetMyXpResponse } from '@/types/achievement';

export function getMyXp(token: string): Promise<GetMyXpResponse> {
  return apiRequest('/users/me/xp', { method: 'GET', token });
}
