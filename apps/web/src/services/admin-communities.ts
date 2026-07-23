import { apiRequest } from './http';
import type {
  CreateCommunityPayload,
  GetCommunitiesResponse,
  GetCommunityResponse,
  UpdateCommunityPayload,
} from '@/types/community';

export function listAllCommunities(token: string): Promise<GetCommunitiesResponse> {
  return apiRequest('/communities/all', { method: 'GET', token });
}

export function createCommunity(
  token: string,
  payload: CreateCommunityPayload,
): Promise<GetCommunityResponse> {
  return apiRequest('/communities', { method: 'POST', token, body: payload });
}

export function updateCommunity(
  token: string,
  id: string,
  payload: UpdateCommunityPayload,
): Promise<GetCommunityResponse> {
  return apiRequest(`/communities/${id}`, { method: 'PATCH', token, body: payload });
}
