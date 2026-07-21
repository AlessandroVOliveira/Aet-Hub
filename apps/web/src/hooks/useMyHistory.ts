import { useQuery } from '@tanstack/react-query';
import { getMyHistory } from '@/services/profile';
import { useAuth } from '@/hooks/useAuth';

export const MY_HISTORY_QUERY_KEY = ['my-history'] as const;

export function useMyHistory() {
  const { token } = useAuth();

  return useQuery({
    queryKey: MY_HISTORY_QUERY_KEY,
    queryFn: () => getMyHistory(token as string),
    enabled: !!token,
  });
}
