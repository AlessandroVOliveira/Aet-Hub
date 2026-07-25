import type { Role } from './auth';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
  isMuted: boolean;
  createdAt: string;
  profile: { displayName: string } | null;
}

export interface ListUsersResponse {
  users: AdminUser[];
}

export interface ModerateUserPayload {
  isActive?: boolean;
  isMuted?: boolean;
  reason: string;
}

export interface ModerateUserResponse {
  user: AdminUser;
}
