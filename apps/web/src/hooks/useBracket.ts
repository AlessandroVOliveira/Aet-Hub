import { useQuery } from '@tanstack/react-query';
import { getBracket } from '@/services/matches';
import { useAuth } from '@/hooks/useAuth';

export const bracketQueryKey = (tournamentId: string) => ['bracket', tournamentId] as const;

export function useBracket(tournamentId: string | undefined) {
  const { token } = useAuth();

  return useQuery({
    queryKey: bracketQueryKey(tournamentId ?? ''),
    queryFn: () => getBracket(token as string, tournamentId as string),
    enabled: !!token && !!tournamentId,
  });
}
