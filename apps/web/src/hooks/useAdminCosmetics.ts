import { useQuery } from '@tanstack/react-query';
import { listAllCosmetics } from '@/services/admin-cosmetics';
import { useAuth } from '@/hooks/useAuth';

export const ADMIN_COSMETICS_QUERY_KEY = ['admin-cosmetics'] as const;

export function useAdminCosmetics() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ADMIN_COSMETICS_QUERY_KEY,
    queryFn: () => listAllCosmetics(token as string),
    enabled: !!token,
  });
}
