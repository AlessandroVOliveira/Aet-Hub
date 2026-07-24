import { useQuery } from '@tanstack/react-query';
import { listAllGames } from '@/services/admin-games';
import { useAuth } from '@/hooks/useAuth';

export const ADMIN_GAMES_QUERY_KEY = ['admin-games'] as const;

export function useAdminGames() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ADMIN_GAMES_QUERY_KEY,
    queryFn: () => listAllGames(token as string),
    enabled: !!token,
  });
}
