import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminTournaments } from '@/hooks/useAdminTournaments';
import { useDeleteTournament, useQuickStatusChange } from '@/hooks/useAdminTournamentMutations';
import { QUICK_STATUS_ACTIONS } from '@/utils/tournament-status-actions';
import { formatDate, tournamentStatusLabels } from '@/utils/format';
import { ApiError } from '@/services/http';
import type { TournamentStatus } from '@/types/tournament';
import styles from './AdminTournamentsPage.module.css';

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
    <section>
      <div className={styles.header}>
        <h2 className={styles.title}>Torneios (admin)</h2>
        <Link to="/admin/torneios/novo" className={styles.newButton}>
          Novo torneio
        </Link>
      </div>

      {actionError && <p className={styles.errorBanner}>{actionError}</p>}

      {isError && (
        <p className={styles.errorBanner}>
          {error instanceof ApiError ? error.message : 'Erro inesperado'}
        </p>
      )}

      {isLoading && <p>Carregando...</p>}

      {!isLoading && !isError && data?.tournaments.length === 0 && (
        <p className={styles.emptyState}>Nenhum torneio cadastrado ainda.</p>
      )}

      {data && data.tournaments.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Jogo</th>
                <th>Status</th>
                <th>Evento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.tournaments.map((tournament) => (
                <tr key={tournament.id}>
                  <td>{tournament.name}</td>
                  <td>{tournament.game.name}</td>
                  <td>
                    <span className={styles.statusBadge} data-status={tournament.status}>
                      {tournamentStatusLabels[tournament.status]}
                    </span>
                  </td>
                  <td>{formatDate(tournament.eventStartAt)}</td>
                  <td className={styles.actions}>
                    <Link to={`/admin/torneios/${tournament.id}/editar`}>Editar</Link>
                    {(QUICK_STATUS_ACTIONS[tournament.status] ?? []).map((action) => (
                      <button
                        key={action.next}
                        type="button"
                        className={
                          action.destructive ? styles.destructiveButton : styles.actionButton
                        }
                        disabled={quickStatusChange.isPending}
                        onClick={() =>
                          handleQuickStatusChange(tournament.id, action.next, action.label)
                        }
                      >
                        {action.label}
                      </button>
                    ))}
                    {tournament.status === 'DRAFT' && (
                      <button
                        type="button"
                        className={styles.destructiveButton}
                        disabled={deleteTournament.isPending}
                        onClick={() => handleDelete(tournament.id)}
                      >
                        Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
