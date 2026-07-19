import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recordMatchResult } from '@/services/matches';
import { useAuth } from '@/hooks/useAuth';
import { bracketQueryKey } from '@/hooks/useBracket';
import type { RecordMatchResultPayload } from '@/types/bracket';

export function useRecordMatchResult(tournamentId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      matchId,
      payload,
    }: {
      matchId: string;
      payload: RecordMatchResultPayload;
    }) => recordMatchResult(token as string, matchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bracketQueryKey(tournamentId) });
    },
  });
}
