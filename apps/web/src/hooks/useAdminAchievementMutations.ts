import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAchievement, updateAchievement } from '@/services/admin-achievements';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_ACHIEVEMENTS_QUERY_KEY } from '@/hooks/useAdminAchievements';
import { ACHIEVEMENTS_QUERY_KEY } from '@/hooks/useAchievements';
import type { CreateAchievementPayload, UpdateAchievementPayload } from '@/types/achievement';

export function useCreateAchievement() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAchievementPayload) => createAchievement(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ACHIEVEMENTS_QUERY_KEY });
    },
  });
}

export function useUpdateAchievement(id: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAchievementPayload) =>
      updateAchievement(token as string, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ACHIEVEMENTS_QUERY_KEY });
    },
  });
}

export function useToggleAchievementActive() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateAchievement(token as string, id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ACHIEVEMENTS_QUERY_KEY });
    },
  });
}
