import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStoreItems } from '@/hooks/useStoreItems';
import { useMyWallet } from '@/hooks/useMyWallet';
import { useCreateRedemption } from '@/hooks/useRedemptionMutations';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';

export function StoreItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useStoreItems();
  const { data: walletData } = useMyWallet();
  const createRedemption = useCreateRedemption();
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) return <p className="p-4 md:p-8 text-sm text-silver-muted">Carregando...</p>;

  if (isError) {
    return (
      <div className="p-4 md:p-8">
        <Banner variant="error">
          {error instanceof ApiError ? error.message : 'Erro inesperado'}
        </Banner>
      </div>
    );
  }

  const item = data?.items.find((entry) => entry.id === id);

  if (!item) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-sm text-silver-muted mb-4">
          Item não encontrado ou não está mais disponível.
        </p>
        <Link to="/loja" className="text-ember hover:underline font-mono text-xs uppercase">
          Voltar para a loja
        </Link>
      </div>
    );
  }

  const balance = walletData?.balance ?? 0;
  const soldOut = item.stock !== null && item.stock <= 0;
  const canAfford = balance >= item.costInCoins;

  function handleRedeem() {
    if (!item) return;
    setActionError(null);
    createRedemption.mutate(
      { storeItemId: item.id },
      {
        onSuccess: () => {
          navigate('/minhas-trocas', { state: { redeemed: item.name } });
        },
        onError: (mutationError) => {
          setActionError(
            mutationError instanceof ApiError ? mutationError.message : 'Erro inesperado',
          );
        },
      },
    );
  }

  const redeemLabel = !canAfford
    ? 'Saldo insuficiente'
    : soldOut
      ? 'Sem estoque'
      : createRedemption.isPending
        ? 'Resgatando...'
        : 'Resgatar agora';

  return (
    <div className="p-4 md:p-8">
      <Link to="/loja" className="font-mono text-[10px] text-silver-muted uppercase hover:text-ember">
        ← Voltar à loja
      </Link>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="aspect-square bg-navy-light ring-1 ring-silver/10 overflow-hidden">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-ember/40 via-navy-dark to-navy-light grid place-items-center">
              <span className="font-display italic text-9xl text-silver/20 uppercase">
                {item.name[0]}
              </span>
            </div>
          )}
        </div>

        <div>
          {item.partnerName && (
            <p className="font-mono text-[10px] text-ember uppercase">{item.partnerName}</p>
          )}
          <h1 className="font-display text-4xl md:text-5xl uppercase italic tracking-tight mt-2 leading-none">
            {item.name}
          </h1>
          <p className="text-sm text-silver-muted mt-4 max-w-md">{item.description}</p>

          {actionError && (
            <div className="mt-4">
              <Banner variant="error">{actionError}</Banner>
            </div>
          )}

          <div className="mt-8 bg-navy-light ring-1 ring-silver/10 p-6">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] text-silver-muted uppercase">Preço</span>
              <span className="font-display italic text-4xl text-ember">
                {item.costInCoins.toLocaleString('pt-BR')} PTS
              </span>
            </div>
            <div className="mt-4 flex items-baseline justify-between text-sm">
              <span className="text-silver-muted font-mono uppercase text-[10px]">Você tem</span>
              <span className="font-mono">{balance.toLocaleString('pt-BR')} PTS</span>
            </div>
            <div className="mt-4 flex items-baseline justify-between text-sm">
              <span className="text-silver-muted font-mono uppercase text-[10px]">Estoque</span>
              <span className="font-mono">
                {item.stock === null ? '∞' : `${item.stock} un.`}
              </span>
            </div>
            <button
              type="button"
              disabled={!canAfford || soldOut || createRedemption.isPending}
              onClick={handleRedeem}
              className="mt-6 w-full bg-ember hover:bg-ember-glow text-white font-display py-3 tracking-widest uppercase italic transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {redeemLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
