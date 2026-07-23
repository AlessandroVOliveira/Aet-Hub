import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminStoreItems } from '@/hooks/useAdminStoreItems';
import { useToggleStoreItemActive } from '@/hooks/useAdminStoreItemMutations';
import { activeStatusChip } from '@/utils/format';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Banner } from '@/components/ui/Banner';
import type { StoreItem } from '@/types/store';

export function AdminStoreItemsPage() {
  const { data, isLoading, isError, error } = useAdminStoreItems();
  const toggleActive = useToggleStoreItemActive();
  const [actionError, setActionError] = useState<string | null>(null);

  function handleToggleActive(item: StoreItem) {
    const next = !item.isActive;
    const label = next ? 'Ativar' : 'Desativar';
    if (!window.confirm(`Confirmar: ${label} "${item.name}"?`)) return;
    setActionError(null);
    toggleActive.mutate(
      { id: item.id, isActive: next },
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
        title="LOJA"
        accent="ADMIN"
        actions={
          <>
            <Link
              to="/admin/loja/resgates"
              className="px-4 py-2 bg-navy-light ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-xs uppercase tracking-widest"
            >
              Resgates
            </Link>
            <Link
              to="/admin/loja/novo"
              className="px-4 py-2 bg-ember hover:bg-ember-glow text-white font-display italic uppercase text-xs tracking-widest"
            >
              + Novo item
            </Link>
          </>
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

        {!isLoading && !isError && data?.items.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhum item cadastrado ainda.</p>
        )}

        {data && data.items.length > 0 && (
          <div className="bg-navy-light ring-1 ring-silver/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-[10px] uppercase text-silver-muted">
                <tr className="border-b border-silver/10">
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Parceiro</th>
                  <th className="px-4 py-2">Custo</th>
                  <th className="px-4 py-2">Estoque</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const soldOut = item.stock !== null && item.stock <= 0;
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-silver/5 ${!item.isActive ? 'opacity-50' : ''}`}
                    >
                      <td className="px-4 py-3 font-display italic uppercase">{item.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{item.partnerName ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{item.costInCoins} PTS</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {item.stock === null ? (
                          '∞'
                        ) : soldOut ? (
                          <span className="text-ember">{item.stock} (esgotado)</span>
                        ) : (
                          item.stock
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip {...activeStatusChip(item.isActive)} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Link
                            to={`/admin/loja/${item.id}/editar`}
                            className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase"
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
                            disabled={toggleActive.isPending}
                            onClick={() => handleToggleActive(item)}
                            className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase disabled:opacity-60"
                          >
                            {item.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
