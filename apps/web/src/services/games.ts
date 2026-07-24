import { apiRequest } from './http';
import type { GetGamesResponse } from '@/types/game';

export function listGames(token: string): Promise<GetGamesResponse> {
  return apiRequest('/games', { method: 'GET', token });
}
