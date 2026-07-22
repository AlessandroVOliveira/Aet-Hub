import { apiRequest } from './http';
import type { GetRankingResponse } from '@/types/ranking';

export function getRanking(token: string): Promise<GetRankingResponse> {
  return apiRequest('/ranking', { method: 'GET', token });
}
