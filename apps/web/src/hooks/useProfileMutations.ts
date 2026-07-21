import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMyProfile } from '@/services/profile';
import { useAuth, ME_QUERY_KEY } from '@/hooks/useAuth';
import type { UpdateProfilePayload } from '@/types/profile';

export function useUpdateProfile() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateMyProfile(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY(token) });
    },
  });
}
