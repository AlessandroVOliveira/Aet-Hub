import { apiRequest } from './http';
import type {
  CancelRegistrationResponse,
  CreateRegistrationPayload,
  CreateRegistrationResponse,
  GetMyRegistrationsResponse,
} from '@/types/registration';

export function listMyRegistrations(token: string): Promise<GetMyRegistrationsResponse> {
  return apiRequest('/registrations/me', { method: 'GET', token });
}

export function createRegistration(
  token: string,
  payload: CreateRegistrationPayload,
): Promise<CreateRegistrationResponse> {
  return apiRequest('/registrations', { method: 'POST', token, body: payload });
}

export function cancelRegistration(
  token: string,
  tournamentId: string,
): Promise<CancelRegistrationResponse> {
  return apiRequest(`/registrations/${tournamentId}/cancel`, { method: 'POST', token });
}
