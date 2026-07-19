import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelRegistration, createRegistration } from '@/services/registrations';
import { useAuth } from '@/hooks/useAuth';
import { MY_REGISTRATIONS_QUERY_KEY } from '@/hooks/useMyRegistrations';
import type { CreateRegistrationPayload } from '@/types/registration';

export function useCreateRegistration() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRegistrationPayload) =>
      createRegistration(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_REGISTRATIONS_QUERY_KEY });
    },
  });
}

export function useCancelRegistration() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tournamentId: string) => cancelRegistration(token as string, tournamentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_REGISTRATIONS_QUERY_KEY });
    },
  });
}
