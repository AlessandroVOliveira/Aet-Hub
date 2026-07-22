import { useQuery } from '@tanstack/react-query';
import { getRanking } from '@/services/ranking';
import { useAuth } from '@/hooks/useAuth';

export const RANKING_QUERY_KEY = ['ranking'] as const;

export function useRanking() {
  const { token } = useAuth();

  return useQuery({
    queryKey: RANKING_QUERY_KEY,
    queryFn: () => getRanking(token as string),
    enabled: !!token,
  });
}
