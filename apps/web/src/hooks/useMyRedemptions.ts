import { useQuery } from '@tanstack/react-query';
import { listMyRedemptions } from '@/services/store';
import { useAuth } from '@/hooks/useAuth';

export const MY_REDEMPTIONS_QUERY_KEY = ['my-redemptions'] as const;

export function useMyRedemptions() {
  const { token } = useAuth();

  return useQuery({
    queryKey: MY_REDEMPTIONS_QUERY_KEY,
    queryFn: () => listMyRedemptions(token as string),
    enabled: !!token,
  });
}
