import { useQuery } from '@tanstack/react-query';
import { listAllStoreItems } from '@/services/admin-store';
import { useAuth } from '@/hooks/useAuth';

export const ADMIN_STORE_ITEMS_QUERY_KEY = ['admin-store-items'] as const;

export function useAdminStoreItems() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ADMIN_STORE_ITEMS_QUERY_KEY,
    queryFn: () => listAllStoreItems(token as string),
    enabled: !!token,
  });
}
