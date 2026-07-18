export type Role = 'PLAYER' | 'ADMIN';

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  cep: string;
  addressNumber: string;
  addressComplement?: string;
  displayName?: string;
  acceptedTerms: boolean;
}

export interface RegisterResponse {
  user: AuthUser;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  favoriteGameId: string | null;
  favoriteCharacter: string | null;
  theme: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
  favoriteGame: { id: string; name: string; slug: string } | null;
  user: { id: string; username: string; email: string };
}

export interface GetMeResponse {
  profile: UserProfile;
}
