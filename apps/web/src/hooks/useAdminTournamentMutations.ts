import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAdminTournament,
  deleteAdminTournament,
  getAdminTournament,
  toUpdatePayload,
  updateAdminTournament,
} from '@/services/admin-tournaments';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_TOURNAMENTS_QUERY_KEY } from '@/hooks/useAdminTournaments';
import { adminTournamentQueryKey } from '@/hooks/useAdminTournament';
import type {
  CreateTournamentPayload,
  TournamentStatus,
  UpdateTournamentPayload,
} from '@/types/tournament';

export function useCreateTournament() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTournamentPayload) =>
      createAdminTournament(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_TOURNAMENTS_QUERY_KEY });
    },
  });
}

export function useUpdateTournament(id: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTournamentPayload) =>
      updateAdminTournament(token as string, id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_TOURNAMENTS_QUERY_KEY });
      queryClient.setQueryData(adminTournamentQueryKey(id), data);
    },
  });
}

export function useDeleteTournament() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteAdminTournament(token as string, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_TOURNAMENTS_QUERY_KEY });
    },
  });
}

// Nunca usa dado da listagem (sem sponsors/placementRewards) como fonte do
// PUT: sempre busca o detalhe completo antes de montar o payload, pra não
// apagar sponsors/placementRewards existentes num replace incompleto.
export function useQuickStatusChange() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TournamentStatus }) => {
      const { tournament } = await getAdminTournament(token as string, id);
      const payload = toUpdatePayload(tournament, { status });
      return updateAdminTournament(token as string, id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_TOURNAMENTS_QUERY_KEY });
    },
  });
}
