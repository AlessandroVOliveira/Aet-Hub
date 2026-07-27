import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCosmeticItem, updateCosmeticItem } from '@/services/admin-cosmetics';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_COSMETICS_QUERY_KEY } from '@/hooks/useAdminCosmetics';
import { COSMETICS_QUERY_KEY } from '@/hooks/useCosmetics';
import type { CreateCosmeticItemPayload, UpdateCosmeticItemPayload } from '@/types/cosmetic';

export function useCreateCosmeticItem() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCosmeticItemPayload) => createCosmeticItem(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_COSMETICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: COSMETICS_QUERY_KEY });
    },
  });
}

export function useUpdateCosmeticItem(id: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCosmeticItemPayload) =>
      updateCosmeticItem(token as string, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_COSMETICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: COSMETICS_QUERY_KEY });
    },
  });
}

export function useToggleCosmeticItemActive() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateCosmeticItem(token as string, id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_COSMETICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: COSMETICS_QUERY_KEY });
    },
  });
}
