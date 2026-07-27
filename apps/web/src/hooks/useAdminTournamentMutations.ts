import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  completeAdminTournament,
  createAdminTournament,
  deleteAdminTournament,
  getAdminTournament,
  startAdminTournament,
  toUpdatePayload,
  updateAdminTournament,
} from '@/services/admin-tournaments';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_TOURNAMENTS_QUERY_KEY } from '@/hooks/useAdminTournaments';
import { adminTournamentQueryKey } from '@/hooks/useAdminTournament';
import { bracketQueryKey } from '@/hooks/useBracket';
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

// Único caminho pra sair de CHECKIN_OPEN em direção a IN_PROGRESS — gera a
// chave e inicia o torneio numa operação atômica do backend (POST /:id/start),
// nunca via useQuickStatusChange (esse só troca o campo status, sem gerar
// BracketSlot/Match nenhum).
export function useStartTournament() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => startAdminTournament(token as string, id),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_TOURNAMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: adminTournamentQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: bracketQueryKey(id) });
    },
  });
}

// Único caminho pra sair de IN_PROGRESS em direção a COMPLETED — calcula
// colocação/pontos/XP/conquistas no backend (POST /:id/complete). Mesmo
// racional de useStartTournament: nunca via useQuickStatusChange.
export function useCompleteTournament() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) => completeAdminTournament(token as string, id),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_TOURNAMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: adminTournamentQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: bracketQueryKey(id) });
    },
  });
}
