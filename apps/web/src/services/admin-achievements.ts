import { apiRequest } from './http';
import type {
  CreateAchievementPayload,
  GetAchievementResponse,
  GetAchievementsResponse,
  UpdateAchievementPayload,
} from '@/types/achievement';

export function listAllAchievements(token: string): Promise<GetAchievementsResponse> {
  return apiRequest('/achievements/all', { method: 'GET', token });
}

export function createAchievement(
  token: string,
  payload: CreateAchievementPayload,
): Promise<GetAchievementResponse> {
  return apiRequest('/achievements', { method: 'POST', token, body: payload });
}

export function updateAchievement(
  token: string,
  id: string,
  payload: UpdateAchievementPayload,
): Promise<GetAchievementResponse> {
  return apiRequest(`/achievements/${id}`, { method: 'PATCH', token, body: payload });
}
