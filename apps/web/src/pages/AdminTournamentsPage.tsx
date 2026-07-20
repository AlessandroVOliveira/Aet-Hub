import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminTournaments } from '@/hooks/useAdminTournaments';
import { useDeleteTournament, useQuickStatusChange } from '@/hooks/useAdminTournamentMutations';
import { QUICK_STATUS_ACTIONS } from '@/utils/tournament-status-actions';
import { formatDate, tournamentStatusLabels, tournamentStatusTone } from '@/utils/format';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Banner } from '@/components/ui/Banner';
import type { TournamentStatus } from '@/types/tournament';

export function AdminTournamentsPage() {
  const { data, isLoading, isError, error } = useAdminTournaments();
  const quickStatusChange = useQuickStatusChange();
  const deleteTournament = useDeleteTournament();
  const [actionError, setActionError] = useState<string | null>(null);

  function handleQuickStatusChange(id: string, next: TournamentStatus, label: string) {
    if (!window.confirm(`Confirmar: ${label}?`)) return;
    setActionError(null);
    quickStatusChange.mutate(
      { id, status: next },
      {
        onError: (mutationError) => {
          setActionError(
            mutationError instanceof ApiError ? mutationError.message : 'Erro inesperado',
          );
        },
      },
    );
  }

  function handleDelete(id: string) {
    if (!window.confirm('Excluir este torneio em rascunho? Essa ação não pode ser desfeita.')) {
      return;
    }
    setActionError(null);
    deleteTournament.mutate(
      { id },
      {
        onError: (mutationError) => {
          setActionError(
            mutationError instanceof ApiError ? mutationError.message : 'Erro inesperado',
          );
        },
      },
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="STAFF_ONLY"
        title="TORNEIOS"
        accent="ADMIN"
        actions={
          <Link
            to="/admin/torneios/novo"
            className="px-4 py-2 bg-ember hover:bg-ember-glow text-white font-display italic uppercase text-xs tracking-widest"
          >
            + Novo torneio
          </Link>
        }
      />

      <div className="p-4 md:p-8 space-y-4">
        {actionError && <Banner variant="error">{actionError}</Banner>}

        {isError && (
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        )}

        {isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {!isLoading && !isError && data?.tournaments.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhum torneio cadastrado ainda.</p>
        )}

        {data && data.tournaments.length > 0 && (
          <div className="bg-navy-light ring-1 ring-silver/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-[10px] uppercase text-silver-muted">
                <tr className="border-b border-silver/10">
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Jogo</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Evento</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.tournaments.map((tournament) => (
                  <tr key={tournament.id} className="border-b border-silver/5">
                    <td className="px-4 py-3 font-display italic uppercase">{tournament.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{tournament.game.name}</td>
                    <td className="px-4 py-3">
                      <StatusChip
                        label={tournamentStatusLabels[tournament.status]}
                        tone={tournamentStatusTone[tournament.status]}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-silver-muted">
                      {formatDate(tournament.eventStartAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Link
                          to={`/admin/torneios/${tournament.id}/editar`}
                          className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase"
                        >
                          Editar
                        </Link>
                        {tournament.status !== 'DRAFT' && tournament.status !== 'CANCELLED' && (
                          <Link
                            to={`/admin/torneios/${tournament.id}/checkin`}
                            className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase"
                          >
                            Checkin
                          </Link>
                        )}
                        {(tournament.status === 'IN_PROGRESS' ||
                          tournament.status === 'COMPLETED') && (
                          <Link
                            to={`/torneios/${tournament.id}/chaveamento`}
                            state={{ tournamentName: tournament.name }}
                            className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase"
                          >
                            Chaveamento
                          </Link>
                        )}
                        {(QUICK_STATUS_ACTIONS[tournament.status] ?? []).map((action) => (
                          <button
                            key={action.next}
                            type="button"
                            disabled={quickStatusChange.isPending}
                            onClick={() =>
                              handleQuickStatusChange(tournament.id, action.next, action.label)
                            }
                            className={`px-2 py-1 font-mono text-[10px] uppercase disabled:opacity-60 ${
                              action.destructive
                                ? 'bg-ember/20 ring-1 ring-ember/40 text-ember'
                                : 'bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                        {tournament.status === 'DRAFT' && (
                          <button
                            type="button"
                            disabled={deleteTournament.isPending}
                            onClick={() => handleDelete(tournament.id)}
                            className="px-2 py-1 bg-ember/20 ring-1 ring-ember/40 text-ember font-mono text-[10px] uppercase disabled:opacity-60"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
