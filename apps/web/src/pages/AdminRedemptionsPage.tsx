import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminRedemptions } from '@/hooks/useAdminRedemptions';
import { useUpdateRedemptionStatus } from '@/hooks/useAdminRedemptionMutations';
import { formatDate, redemptionStatusLabels, redemptionStatusTone } from '@/utils/format';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Banner } from '@/components/ui/Banner';
import type { RedemptionStatus, RedemptionWithUser } from '@/types/store';

const STATUS_FILTERS: { label: string; value: RedemptionStatus | 'ALL' }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendente', value: 'PENDING' },
  { label: 'Cumprido', value: 'FULFILLED' },
  { label: 'Cancelado', value: 'CANCELLED' },
];

export function AdminRedemptionsPage() {
  const [statusFilter, setStatusFilter] = useState<RedemptionStatus | 'ALL'>('ALL');
  const { data, isLoading, isError, error } = useAdminRedemptions(
    statusFilter === 'ALL' ? undefined : statusFilter,
  );
  const updateStatus = useUpdateRedemptionStatus();
  const [actionError, setActionError] = useState<string | null>(null);

  function playerName(redemption: RedemptionWithUser) {
    return redemption.user.profile?.displayName || redemption.user.username;
  }

  function handleFulfill(redemption: RedemptionWithUser) {
    if (
      !window.confirm(
        `Confirmar cumprimento do resgate de "${redemption.storeItem.name}" para ${playerName(redemption)}?`,
      )
    ) {
      return;
    }
    setActionError(null);
    updateStatus.mutate(
      { id: redemption.id, payload: { status: 'FULFILLED' } },
      {
        onError: (mutationError) => {
          setActionError(
            mutationError instanceof ApiError ? mutationError.message : 'Erro inesperado',
          );
        },
      },
    );
  }

  function handleCancel(redemption: RedemptionWithUser) {
    if (
      !window.confirm(
        `Confirmar cancelamento e estorno de ${redemption.costInCoins} PTS para ${playerName(redemption)}?`,
      )
    ) {
      return;
    }
    setActionError(null);
    updateStatus.mutate(
      { id: redemption.id, payload: { status: 'CANCELLED' } },
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
        title="RESGATES"
        accent="LOJA"
        actions={
          <Link
            to="/admin/loja"
            className="px-4 py-2 bg-navy-light ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-xs uppercase tracking-widest"
          >
            Itens
          </Link>
        }
      />

      <div className="p-4 md:p-8 space-y-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest ${
                statusFilter === filter.value
                  ? 'bg-navy-dark ring-1 ring-ember/40 text-ember'
                  : 'ring-1 ring-silver/20 text-silver-muted hover:text-silver'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {actionError && <Banner variant="error">{actionError}</Banner>}

        {isError && (
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        )}

        {isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {!isLoading && !isError && data?.redemptions.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhum resgate encontrado.</p>
        )}

        {data && data.redemptions.length > 0 && (
          <div className="bg-navy-light ring-1 ring-silver/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-[10px] uppercase text-silver-muted">
                <tr className="border-b border-silver/10">
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Jogador</th>
                  <th className="px-4 py-2">Custo</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Resgatado em</th>
                  <th className="px-4 py-2">Cumprido em</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.redemptions.map((redemption) => (
                  <tr key={redemption.id} className="border-b border-silver/5">
                    <td className="px-4 py-3">
                      <p className="font-display italic uppercase">{redemption.storeItem.name}</p>
                      {redemption.storeItem.partnerName && (
                        <p className="font-mono text-[10px] text-silver-muted">
                          {redemption.storeItem.partnerName}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{playerName(redemption)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{redemption.costInCoins} PTS</td>
                    <td className="px-4 py-3">
                      <StatusChip
                        label={redemptionStatusLabels[redemption.status]}
                        tone={redemptionStatusTone[redemption.status]}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-silver-muted">
                      {formatDate(redemption.redeemedAt)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-silver-muted">
                      {redemption.fulfilledAt ? formatDate(redemption.fulfilledAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {redemption.status === 'PENDING' && (
                        <div className="flex flex-wrap gap-2 justify-end">
                          <button
                            type="button"
                            disabled={updateStatus.isPending}
                            onClick={() => handleFulfill(redemption)}
                            className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase disabled:opacity-60"
                          >
                            Cumprir
                          </button>
                          <button
                            type="button"
                            disabled={updateStatus.isPending}
                            onClick={() => handleCancel(redemption)}
                            className="px-2 py-1 bg-ember/20 ring-1 ring-ember/40 text-ember font-mono text-[10px] uppercase disabled:opacity-60"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
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
