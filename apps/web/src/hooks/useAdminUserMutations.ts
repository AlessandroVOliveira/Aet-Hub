import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moderateUser, updateUserByAdmin } from '@/services/admin-users';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_USERS_QUERY_KEY } from '@/hooks/useAdminUsers';
import type { AdminUpdateUserPayload, ModerateUserPayload } from '@/types/user';

export function useModerateUser() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ModerateUserPayload }) =>
      moderateUser(token as string, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
  });
}

// RF-16
export function useUpdateUserByAdmin(id: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminUpdateUserPayload) => updateUserByAdmin(token as string, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
  });
}
