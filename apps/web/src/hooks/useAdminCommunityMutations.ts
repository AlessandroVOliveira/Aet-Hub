import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCommunity, updateCommunity } from '@/services/admin-communities';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_COMMUNITIES_QUERY_KEY } from '@/hooks/useAdminCommunities';
import { COMMUNITIES_QUERY_KEY } from '@/hooks/useCommunities';
import type { CreateCommunityPayload, UpdateCommunityPayload } from '@/types/community';

export function useCreateCommunity() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommunityPayload) => createCommunity(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_COMMUNITIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: COMMUNITIES_QUERY_KEY });
    },
  });
}

export function useUpdateCommunity(id: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCommunityPayload) => updateCommunity(token as string, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_COMMUNITIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: COMMUNITIES_QUERY_KEY });
    },
  });
}

export function useToggleCommunityActive() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateCommunity(token as string, id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_COMMUNITIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: COMMUNITIES_QUERY_KEY });
    },
  });
}
