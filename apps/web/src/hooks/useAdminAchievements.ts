import { useQuery } from '@tanstack/react-query';
import { listAllAchievements } from '@/services/admin-achievements';
import { useAuth } from '@/hooks/useAuth';

export const ADMIN_ACHIEVEMENTS_QUERY_KEY = ['admin-achievements'] as const;

export function useAdminAchievements() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY,
    queryFn: () => listAllAchievements(token as string),
    enabled: !!token,
  });
}
