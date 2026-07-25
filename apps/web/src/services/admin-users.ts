import { apiRequest } from './http';
import type {
  AdminUpdateUserPayload,
  AdminUpdateUserResponse,
  ListUsersResponse,
  ModerateUserPayload,
  ModerateUserResponse,
} from '@/types/user';

export function listAllUsers(token: string): Promise<ListUsersResponse> {
  return apiRequest('/users', { method: 'GET', token });
}

export function moderateUser(
  token: string,
  id: string,
  payload: ModerateUserPayload,
): Promise<ModerateUserResponse> {
  return apiRequest(`/users/${id}/moderation`, { method: 'PATCH', token, body: payload });
}

export function updateUserByAdmin(
  token: string,
  id: string,
  payload: AdminUpdateUserPayload,
): Promise<AdminUpdateUserResponse> {
  return apiRequest(`/users/${id}`, { method: 'PATCH', token, body: payload });
}
