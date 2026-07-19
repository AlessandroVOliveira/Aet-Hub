import { useQuery } from '@tanstack/react-query';
import { listMyRegistrations } from '@/services/registrations';
import { useAuth } from '@/hooks/useAuth';

export const MY_REGISTRATIONS_QUERY_KEY = ['my-registrations'] as const;

export function useMyRegistrations() {
  const { token } = useAuth();

  return useQuery({
    queryKey: MY_REGISTRATIONS_QUERY_KEY,
    queryFn: () => listMyRegistrations(token as string),
    enabled: !!token,
  });
}
