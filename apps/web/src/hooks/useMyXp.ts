import { useQuery } from '@tanstack/react-query';
import { getMyXp } from '@/services/xp';
import { useAuth } from '@/hooks/useAuth';

export const MY_XP_QUERY_KEY = ['my-xp'] as const;

export function useMyXp() {
  const { token } = useAuth();

  return useQuery({
    queryKey: MY_XP_QUERY_KEY,
    queryFn: () => getMyXp(token as string),
    enabled: !!token,
  });
}
