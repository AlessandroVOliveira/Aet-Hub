import { useLocation } from 'react-router-dom';
import { useMyRedemptions } from '@/hooks/useMyRedemptions';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { Banner } from '@/components/ui/Banner';
import { StatusChip } from '@/components/ui/StatusChip';
import { formatDate, redemptionStatusLabels, redemptionStatusTone } from '@/utils/format';

interface LocationState {
  redeemed?: string;
}

export function MyRedemptionsPage() {
  const { data, isLoading, isError, error } = useMyRedemptions();
  const location = useLocation();
  const state = location.state as LocationState | null;

  return (
    <div>
      <PageHeader eyebrow="LOJA_PONTOS" title="MINHAS" accent="TROCAS" />

      <div className="p-4 md:p-8">
        {state?.redeemed && (
          <Banner variant="success">Resgate de "{state.redeemed}" confirmado.</Banner>
        )}

        {isError && (
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        )}

        {isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {!isLoading && !isError && data?.redemptions.length === 0 && (
          <p className="text-sm text-silver-muted">Você ainda não resgatou nenhum item.</p>
        )}

        {data && data.redemptions.length > 0 && (
          <div className="bg-navy-light ring-1 ring-silver/10 divide-y divide-silver/5">
            {data.redemptions.map((redemption) => (
              <div
                key={redemption.id}
                className="p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <h3 className="font-display italic uppercase tracking-tight">
                    {redemption.storeItem.name}
                  </h3>
                  <p className="font-mono text-[10px] text-silver-muted mt-1">
                    Resgatado em {formatDate(redemption.redeemedAt)}
                    {redemption.fulfilledAt &&
                      ` • Cumprido em ${formatDate(redemption.fulfilledAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-ember">
                    {redemption.costInCoins.toLocaleString('pt-BR')} PTS
                  </span>
                  <StatusChip
                    label={redemptionStatusLabels[redemption.status]}
                    tone={redemptionStatusTone[redemption.status]}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
