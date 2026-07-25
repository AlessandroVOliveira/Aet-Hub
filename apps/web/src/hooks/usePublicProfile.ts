import { useQuery } from '@tanstack/react-query';
import { getPublicProfile } from '@/services/public-profile';
import { useAuth } from '@/hooks/useAuth';

export function usePublicProfile(userId: string | undefined) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['public-profile', userId],
    queryFn: () => getPublicProfile(token as string, userId as string),
    enabled: !!token && !!userId,
  });
}
