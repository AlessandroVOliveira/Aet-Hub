import { apiRequest } from './http';
import type { GetPublicProfileResponse } from '@/types/public-profile';

export function getPublicProfile(token: string, userId: string): Promise<GetPublicProfileResponse> {
  return apiRequest(`/users/${userId}/public`, { method: 'GET', token });
}
