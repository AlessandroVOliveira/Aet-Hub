import type { Role } from './auth';

export interface AdminUserProfile {
  displayName: string;
  favoriteGameId: string | null;
  favoriteCharacter: string | null;
  theme: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
  isMuted: boolean;
  deletedAt: string | null;
  createdAt: string;
  profile: AdminUserProfile | null;
}

export interface ListUsersResponse {
  users: AdminUser[];
}

export interface ModerateUserPayload {
  isActive?: boolean;
  isMuted?: boolean;
  deleted?: boolean;
  reason: string;
}

export interface ModerateUserResponse {
  user: AdminUser;
}

export interface AdminUpdateUserPayload {
  username?: string;
  email?: string;
  displayName?: string;
  favoriteGameId?: string | null;
  favoriteCharacter?: string | null;
  theme?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  reason: string;
}

export interface AdminUpdateUserResponse {
  user: AdminUser;
}
