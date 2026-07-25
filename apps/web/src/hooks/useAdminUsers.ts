import { useQuery } from '@tanstack/react-query';
import { listAllUsers } from '@/services/admin-users';
import { useAuth } from '@/hooks/useAuth';

export const ADMIN_USERS_QUERY_KEY = ['admin-users'] as const;

export function useAdminUsers() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: () => listAllUsers(token as string),
    enabled: !!token,
  });
}
