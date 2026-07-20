import { Link } from 'react-router-dom';
import { useStoreItems } from '@/hooks/useStoreItems';
import { useMyWallet } from '@/hooks/useMyWallet';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { Banner } from '@/components/ui/Banner';

export function StorePage() {
  const { data, isLoading, isError, error } = useStoreItems();
  const { data: walletData } = useMyWallet();
  const balance = walletData?.balance ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="LOJA_PONTOS"
        title="LOJA"
        accent="AET"
        description="Troque seus pontos por recompensas da comunidade."
        actions={
          <Link
            to="/minhas-trocas"
            className="px-4 py-2 bg-navy-light ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-xs uppercase"
          >
            Minhas trocas
          </Link>
        }
      />

      <div className="p-4 md:p-8">
        {isError && (
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        )}

        {isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {!isLoading && !isError && data?.items.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhum item disponível na loja no momento.</p>
        )}

        {data && data.items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.items.map((item) => {
              const soldOut = item.stock !== null && item.stock <= 0;
              const canAfford = balance >= item.costInCoins;

              return (
                <Link
                  key={item.id}
                  to={`/loja/${item.id}`}
                  className={`group bg-navy-light ring-1 ring-silver/10 hover:ring-ember/50 transition flex flex-col ${
                    soldOut ? 'opacity-50' : ''
                  }`}
                >
                  <div className="relative aspect-square bg-navy-dark overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-ember/40 via-navy-dark to-navy-light grid place-items-center">
                        <span className="font-display italic text-5xl text-silver/20 uppercase">
                          {item.name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    {item.partnerName && (
                      <p className="font-mono text-[10px] text-silver-muted mb-1 uppercase">
                        {item.partnerName}
                      </p>
                    )}
                    <h3 className="font-display text-lg italic uppercase tracking-tight mb-3 group-hover:text-ember transition">
                      {item.name}
                    </h3>
                    <div className="mt-auto flex items-center justify-between">
                      <span
                        className={`font-mono font-bold ${canAfford ? 'text-ember' : 'text-silver-muted'}`}
                      >
                        {item.costInCoins.toLocaleString('pt-BR')} PTS
                      </span>
                      <span className="font-mono text-[10px] uppercase text-silver-muted">
                        {soldOut ? 'esgotado' : item.stock === null ? '∞' : `${item.stock} un.`}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
