import { apiRequest } from './http';
import type {
  GetBracketResponse,
  RecordMatchResultPayload,
  RecordMatchResultResponse,
} from '@/types/bracket';

export function getBracket(token: string, tournamentId: string): Promise<GetBracketResponse> {
  return apiRequest(`/matches/tournaments/${tournamentId}/bracket`, { method: 'GET', token });
}

export function recordMatchResult(
  token: string,
  matchId: string,
  payload: RecordMatchResultPayload,
): Promise<RecordMatchResultResponse> {
  return apiRequest(`/matches/${matchId}/result`, { method: 'POST', token, body: payload });
}
