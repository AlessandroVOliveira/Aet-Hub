import { apiRequest } from './http';
import type {
  GetMeResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from '@/types/auth';

export function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiRequest('/auth/register', { method: 'POST', body: payload });
}

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiRequest('/auth/login', { method: 'POST', body: payload });
}

export function getMe(token: string): Promise<GetMeResponse> {
  return apiRequest('/users/me', { method: 'GET', token });
}
