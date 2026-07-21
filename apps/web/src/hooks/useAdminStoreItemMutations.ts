import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStoreItem, updateStoreItem } from '@/services/admin-store';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_STORE_ITEMS_QUERY_KEY } from '@/hooks/useAdminStoreItems';
import { STORE_ITEMS_QUERY_KEY } from '@/hooks/useStoreItems';
import type { CreateStoreItemPayload, UpdateStoreItemPayload } from '@/types/store';

export function useCreateStoreItem() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStoreItemPayload) => createStoreItem(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_STORE_ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STORE_ITEMS_QUERY_KEY });
    },
  });
}

export function useUpdateStoreItem(id: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStoreItemPayload) => updateStoreItem(token as string, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_STORE_ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STORE_ITEMS_QUERY_KEY });
    },
  });
}

export function useToggleStoreItemActive() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateStoreItem(token as string, id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_STORE_ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STORE_ITEMS_QUERY_KEY });
    },
  });
}
