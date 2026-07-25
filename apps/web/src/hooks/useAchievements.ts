import { useQuery } from '@tanstack/react-query';
import { listAchievements } from '@/services/achievements';
import { useAuth } from '@/hooks/useAuth';

export const ACHIEVEMENTS_QUERY_KEY = ['achievements'] as const;

export function useAchievements() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ACHIEVEMENTS_QUERY_KEY,
    queryFn: () => listAchievements(token as string),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}
