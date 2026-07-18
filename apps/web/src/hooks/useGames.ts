import { useQuery } from '@tanstack/react-query';
import { listGames } from '@/services/games';
import { useAuth } from '@/hooks/useAuth';

export const GAMES_QUERY_KEY = ['games'] as const;

export function useGames() {
  const { token } = useAuth();

  return useQuery({
    queryKey: GAMES_QUERY_KEY,
    queryFn: () => listGames(token as string),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}
