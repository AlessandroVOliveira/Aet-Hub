import { useQuery } from '@tanstack/react-query';
import { getAdminTournament } from '@/services/admin-tournaments';
import { useAuth } from '@/hooks/useAuth';

export const adminTournamentQueryKey = (id: string) => ['admin-tournament', id] as const;

export function useAdminTournament(id: string | undefined) {
  const { token } = useAuth();

  return useQuery({
    queryKey: adminTournamentQueryKey(id ?? ''),
    queryFn: () => getAdminTournament(token as string, id as string),
    enabled: !!token && !!id,
  });
}
