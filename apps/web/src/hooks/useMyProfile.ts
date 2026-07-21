import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/services/auth';
import { useAuth, ME_QUERY_KEY } from '@/hooks/useAuth';

export function useMyProfile() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ME_QUERY_KEY(token),
    queryFn: () => getMe(token as string),
    enabled: !!token,
  });
}
