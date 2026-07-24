import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGame, updateGame } from '@/services/admin-games';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_GAMES_QUERY_KEY } from '@/hooks/useAdminGames';
import { GAMES_QUERY_KEY } from '@/hooks/useGames';
import type { CreateGamePayload, UpdateGamePayload } from '@/types/game';

export function useCreateGame() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGamePayload) => createGame(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_GAMES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: GAMES_QUERY_KEY });
    },
  });
}

export function useUpdateGame(id: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateGamePayload) => updateGame(token as string, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_GAMES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: GAMES_QUERY_KEY });
    },
  });
}

export function useToggleGameActive() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateGame(token as string, id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_GAMES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: GAMES_QUERY_KEY });
    },
  });
}
