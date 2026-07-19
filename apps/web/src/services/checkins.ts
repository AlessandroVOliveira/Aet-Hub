import { apiRequest } from './http';
import type {
  CreateCheckinPayload,
  CreateCheckinResponse,
  GetTournamentCheckinsResponse,
} from '@/types/checkin';

export function createCheckin(
  token: string,
  payload: CreateCheckinPayload,
): Promise<CreateCheckinResponse> {
  return apiRequest('/checkins', { method: 'POST', token, body: payload });
}

export function listTournamentCheckins(
  token: string,
  tournamentId: string,
): Promise<GetTournamentCheckinsResponse> {
  return apiRequest(`/checkins/tournaments/${tournamentId}`, { method: 'GET', token });
}
