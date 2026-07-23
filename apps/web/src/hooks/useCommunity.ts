import { useQuery } from '@tanstack/react-query';
import { getCommunity } from '@/services/communities';
import { useAuth } from '@/hooks/useAuth';

export const communityQueryKey = (id: string) => ['communities', id] as const;

export function useCommunity(id: string | undefined) {
  const { token } = useAuth();

  return useQuery({
    queryKey: communityQueryKey(id ?? ''),
    queryFn: () => getCommunity(token as string, id as string),
    enabled: !!token && !!id,
  });
}
