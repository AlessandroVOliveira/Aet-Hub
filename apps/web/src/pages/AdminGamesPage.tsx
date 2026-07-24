import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminGames } from '@/hooks/useAdminGames';
import { useToggleGameActive } from '@/hooks/useAdminGameMutations';
import { activeStatusChip } from '@/utils/format';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Banner } from '@/components/ui/Banner';
import type { Game } from '@/types/game';

export function AdminGamesPage() {
  const { data, isLoading, isError, error } = useAdminGames();
  const toggleActive = useToggleGameActive();
  const [actionError, setActionError] = useState<string | null>(null);

  function handleToggleActive(game: Game) {
    const next = !game.isActive;
    const label = next ? 'Ativar' : 'Desativar';
    if (!window.confirm(`Confirmar: ${label} "${game.name}"?`)) return;
    setActionError(null);
    toggleActive.mutate(
      { id: game.id, isActive: next },
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
        title="JOGOS"
        accent="ADMIN"
        actions={
          <Link
            to="/admin/jogos/novo"
            className="px-4 py-2 bg-ember hover:bg-ember-glow text-white font-display italic uppercase text-xs tracking-widest"
          >
            + Novo jogo
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

        {!isLoading && !isError && data?.games.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhum jogo cadastrado ainda.</p>
        )}

        {data && data.games.length > 0 && (
          <div className="bg-navy-light ring-1 ring-silver/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-[10px] uppercase text-silver-muted">
                <tr className="border-b border-silver/10">
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Slug</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.games.map((game) => (
                  <tr
                    key={game.id}
                    className={`border-b border-silver/5 ${!game.isActive ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-display italic uppercase">{game.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-silver-muted">{game.slug}</td>
                    <td className="px-4 py-3">
                      <StatusChip {...activeStatusChip(game.isActive)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Link
                          to={`/admin/jogos/${game.id}/editar`}
                          className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          disabled={toggleActive.isPending}
                          onClick={() => handleToggleActive(game)}
                          className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase disabled:opacity-60"
                        >
                          {game.isActive ? 'Desativar' : 'Ativar'}
                        </button>
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
