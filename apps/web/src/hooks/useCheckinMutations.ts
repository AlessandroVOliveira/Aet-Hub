import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCheckin } from '@/services/checkins';
import { useAuth } from '@/hooks/useAuth';
import { tournamentCheckinsQueryKey } from '@/hooks/useTournamentCheckins';
import type { CreateCheckinPayload } from '@/types/checkin';

export function useCreateCheckin(tournamentId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCheckinPayload) => createCheckin(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tournamentCheckinsQueryKey(tournamentId) });
    },
  });
}
