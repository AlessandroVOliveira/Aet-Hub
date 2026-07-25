import { apiRequest } from './http';
import type { ListFollowersResponse, ListFollowingResponse } from '@/types/follow';

export function getFollowing(token: string): Promise<ListFollowingResponse> {
  return apiRequest('/follows/following', { method: 'GET', token });
}

export function getFollowers(token: string): Promise<ListFollowersResponse> {
  return apiRequest('/follows/followers', { method: 'GET', token });
}

export function followUser(token: string, userId: string): Promise<void> {
  return apiRequest(`/follows/${userId}`, { method: 'POST', token });
}

export function unfollowUser(token: string, userId: string): Promise<void> {
  return apiRequest(`/follows/${userId}`, { method: 'DELETE', token });
}
