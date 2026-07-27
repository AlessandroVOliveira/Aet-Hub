import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminCosmetics } from '@/hooks/useAdminCosmetics';
import { useToggleCosmeticItemActive } from '@/hooks/useAdminCosmeticMutations';
import { activeStatusChip, cosmeticRarityLabels } from '@/utils/format';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Banner } from '@/components/ui/Banner';
import type { CosmeticItem } from '@/types/cosmetic';

const KIND_LABELS = {
  FRAME: 'Borda',
  BANNER: 'Banner',
  TITLE: 'Título',
  FONT: 'Fonte',
  EFFECT: 'Efeito',
  MASCOT: 'Mascote',
} as const;

export function AdminCosmeticsPage() {
  const { data, isLoading, isError, error } = useAdminCosmetics();
  const toggleActive = useToggleCosmeticItemActive();
  const [actionError, setActionError] = useState<string | null>(null);

  function handleToggleActive(item: CosmeticItem) {
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
        title="COSMÉTICOS"
        accent="ADMIN"
        actions={
          <Link
            to="/admin/cosmeticos/novo"
            className="px-4 py-2 bg-ember hover:bg-ember-glow text-white font-display italic uppercase text-xs tracking-widest"
          >
            + Novo cosmético
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

        {!isLoading && !isError && data?.items.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhum cosmético cadastrado ainda.</p>
        )}

        {data && data.items.length > 0 && (
          <div className="bg-navy-light ring-1 ring-silver/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-[10px] uppercase text-silver-muted">
                <tr className="border-b border-silver/10">
                  <th className="px-4 py-2">Categoria</th>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Raridade</th>
                  <th className="px-4 py-2">Preço</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-silver/5 ${!item.isActive ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-silver-muted">
                      {KIND_LABELS[item.kind]}
                    </td>
                    <td className="px-4 py-3 font-display italic uppercase">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-silver-muted">
                      {cosmeticRarityLabels[item.rarity]}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-silver-muted">
                      {item.priceInPoints.toLocaleString('pt-BR')} pts
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip {...activeStatusChip(item.isActive)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Link
                          to={`/admin/cosmeticos/${item.id}/editar`}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
