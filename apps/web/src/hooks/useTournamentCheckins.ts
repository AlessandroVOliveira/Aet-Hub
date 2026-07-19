import { useQuery } from '@tanstack/react-query';
import { listTournamentCheckins } from '@/services/checkins';
import { useAuth } from '@/hooks/useAuth';

export const tournamentCheckinsQueryKey = (tournamentId: string) =>
  ['tournament-checkins', tournamentId] as const;

export function useTournamentCheckins(tournamentId: string | undefined) {
  const { token } = useAuth();

  return useQuery({
    queryKey: tournamentCheckinsQueryKey(tournamentId ?? ''),
    queryFn: () => listTournamentCheckins(token as string, tournamentId as string),
    enabled: !!token && !!tournamentId,
  });
}
