import { apiRequest } from './http';
import type { GetMyWalletResponse } from '@/types/wallet';

export function getMyWallet(token: string): Promise<GetMyWalletResponse> {
  return apiRequest('/users/me/points', { method: 'GET', token });
}
