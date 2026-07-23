import { useQuery } from '@tanstack/react-query';
import { listAllCommunities } from '@/services/admin-communities';
import { useAuth } from '@/hooks/useAuth';

export const ADMIN_COMMUNITIES_QUERY_KEY = ['admin-communities'] as const;

export function useAdminCommunities() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ADMIN_COMMUNITIES_QUERY_KEY,
    queryFn: () => listAllCommunities(token as string),
    enabled: !!token,
  });
}
