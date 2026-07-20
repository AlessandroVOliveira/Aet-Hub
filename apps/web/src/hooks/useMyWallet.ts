import { useQuery } from '@tanstack/react-query';
import { getMyWallet } from '@/services/wallet';
import { useAuth } from '@/hooks/useAuth';

export const MY_WALLET_QUERY_KEY = ['my-wallet'] as const;

export function useMyWallet() {
  const { token } = useAuth();

  return useQuery({
    queryKey: MY_WALLET_QUERY_KEY,
    queryFn: () => getMyWallet(token as string),
    enabled: !!token,
  });
}
