import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminCommunities } from '@/hooks/useAdminCommunities';
import { useToggleCommunityActive } from '@/hooks/useAdminCommunityMutations';
import { activeStatusChip } from '@/utils/format';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Banner } from '@/components/ui/Banner';
import type { Community } from '@/types/community';

export function AdminCommunitiesPage() {
  const { data, isLoading, isError, error } = useAdminCommunities();
  const toggleActive = useToggleCommunityActive();
  const [actionError, setActionError] = useState<string | null>(null);

  function handleToggleActive(community: Community) {
    const next = !community.isActive;
    const label = next ? 'Ativar' : 'Desativar';
    if (!window.confirm(`Confirmar: ${label} "${community.name}"?`)) return;
    setActionError(null);
    toggleActive.mutate(
      { id: community.id, isActive: next },
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
        title="COMUNIDADES"
        accent="ADMIN"
        actions={
          <Link
            to="/admin/comunidades/novo"
            className="px-4 py-2 bg-ember hover:bg-ember-glow text-white font-display italic uppercase text-xs tracking-widest"
          >
            + Nova comunidade
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

        {!isLoading && !isError && data?.communities.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhuma comunidade cadastrada ainda.</p>
        )}

        {data && data.communities.length > 0 && (
          <div className="bg-navy-light ring-1 ring-silver/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-[10px] uppercase text-silver-muted">
                <tr className="border-b border-silver/10">
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Jogo</th>
                  <th className="px-4 py-2">Posts</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.communities.map((community) => (
                  <tr
                    key={community.id}
                    className={`border-b border-silver/5 ${!community.isActive ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-display italic uppercase">{community.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {community.game?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{community.postCount}</td>
                    <td className="px-4 py-3">
                      <StatusChip {...activeStatusChip(community.isActive)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Link
                          to={`/admin/comunidades/${community.id}/editar`}
                          className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase"
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          disabled={toggleActive.isPending}
                          onClick={() => handleToggleActive(community)}
                          className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase disabled:opacity-60"
                        >
                          {community.isActive ? 'Desativar' : 'Ativar'}
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
