import { useQuery } from '@tanstack/react-query';
import { listAdminTournaments } from '@/services/admin-tournaments';
import { useAuth } from '@/hooks/useAuth';

export const ADMIN_TOURNAMENTS_QUERY_KEY = ['admin-tournaments'] as const;

export function useAdminTournaments() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ADMIN_TOURNAMENTS_QUERY_KEY,
    queryFn: () => listAdminTournaments(token as string),
    enabled: !!token,
  });
}
