import { apiRequest } from './http';
import type { GetAchievementsResponse } from '@/types/achievement';

export function listAchievements(token: string): Promise<GetAchievementsResponse> {
  return apiRequest('/achievements', { method: 'GET', token });
}
