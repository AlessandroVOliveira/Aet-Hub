import { apiRequest } from './http';
import type { GetOpenTournamentsResponse } from '@/types/tournament';

export function listOpenTournaments(token: string): Promise<GetOpenTournamentsResponse> {
  return apiRequest('/registrations/tournaments', { method: 'GET', token });
}
