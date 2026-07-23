import { useQuery } from '@tanstack/react-query';
import { getCommunities } from '@/services/communities';
import { useAuth } from '@/hooks/useAuth';

export const COMMUNITIES_QUERY_KEY = ['communities'] as const;

export function useCommunities() {
  const { token } = useAuth();

  return useQuery({
    queryKey: COMMUNITIES_QUERY_KEY,
    queryFn: () => getCommunities(token as string),
    enabled: !!token,
  });
}
