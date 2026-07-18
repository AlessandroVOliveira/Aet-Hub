import { useQuery } from '@tanstack/react-query';
import { listOpenTournaments } from '@/services/tournaments';
import { useAuth } from '@/hooks/useAuth';

export const OPEN_TOURNAMENTS_QUERY_KEY = ['open-tournaments'] as const;

export function useOpenTournaments() {
  const { token } = useAuth();

  return useQuery({
    queryKey: OPEN_TOURNAMENTS_QUERY_KEY,
    queryFn: () => listOpenTournaments(token as string),
    enabled: !!token,
  });
}
