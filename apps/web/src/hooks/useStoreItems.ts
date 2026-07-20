import { useQuery } from '@tanstack/react-query';
import { listActiveStoreItems } from '@/services/store';
import { useAuth } from '@/hooks/useAuth';

export const STORE_ITEMS_QUERY_KEY = ['store-items'] as const;

export function useStoreItems() {
  const { token } = useAuth();

  return useQuery({
    queryKey: STORE_ITEMS_QUERY_KEY,
    queryFn: () => listActiveStoreItems(token as string),
    enabled: !!token,
  });
}
