import { apiRequest } from './http';
import type { CreateGamePayload, GetGameResponse, GetGamesResponse, UpdateGamePayload } from '@/types/game';

export function listAllGames(token: string): Promise<GetGamesResponse> {
  return apiRequest('/games/all', { method: 'GET', token });
}

export function createGame(token: string, payload: CreateGamePayload): Promise<GetGameResponse> {
  return apiRequest('/games', { method: 'POST', token, body: payload });
}

export function updateGame(
  token: string,
  id: string,
  payload: UpdateGamePayload,
): Promise<GetGameResponse> {
  return apiRequest(`/games/${id}`, { method: 'PATCH', token, body: payload });
}
