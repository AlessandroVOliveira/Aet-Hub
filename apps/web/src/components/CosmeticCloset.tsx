import { useState } from 'react';
import { useCosmetics } from '@/hooks/useCosmetics';
import { usePurchaseCosmeticItem, useUpdateLoadout } from '@/hooks/useCosmeticMutations';
import { useMyWallet } from '@/hooks/useMyWallet';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';
import { cosmeticRarityLabels, cosmeticRarityStyle } from '@/utils/format';
import type { CosmeticKind, CosmeticLoadout, OwnedCosmeticItem } from '@/types/cosmetic';

// Grid/cards espelham src-lovable/pixel-palette-pal-07/src/routes/profile.tsx
// (aba "Personalizar") — fatias 1/3 cobrem Bordas/Títulos/Fontes/Mascotes,
// Banner/Efeito aguardam fatias futuras (ver
// memory/project_cosmetic_locker_slice.md).
const KIND_TABS: { id: CosmeticKind; label: string }[] = [
  { id: 'FRAME', label: 'Bordas' },
  { id: 'TITLE', label: 'Títulos' },
  { id: 'FONT', label: 'Fontes' },
  { id: 'MASCOT', label: 'Mascotes' },
];

// Record completo (não Partial) de propósito: força o compilador a avisar
// se um 7º CosmeticKind for adicionado sem passar por aqui. BANNER/EFFECT
// ficam `undefined` — inalcançáveis pela UI hoje (KIND_TABS não os lista),
// mas o tipo continua exaustivo.
const SLOT_KEY: Record<CosmeticKind, keyof CosmeticLoadout | undefined> = {
  FRAME: 'frameId',
  TITLE: 'titleId',
  FONT: 'fontId',
  MASCOT: 'mascotId',
  BANNER: undefined,
  EFFECT: undefined,
};

export function CosmeticCloset() {
  const [kind, setKind] = useState<CosmeticKind>('FRAME');
  const cosmeticsQuery = useCosmetics();
  const walletQuery = useMyWallet();
  const purchaseMutation = usePurchaseCosmeticItem();
  const loadoutMutation = useUpdateLoadout();
  const [actionError, setActionError] = useState<string | null>(null);

  const loadout = cosmeticsQuery.data?.loadout;
  const balance = walletQuery.data?.balance ?? 0;
  const items = (cosmeticsQuery.data?.items ?? []).filter((item) => item.kind === kind);

  function isEquipped(item: OwnedCosmeticItem): boolean {
    const key = SLOT_KEY[item.kind];
    if (!loadout || !key) return false;
    return loadout[key] === item.id;
  }

  function handleEquip(item: OwnedCosmeticItem) {
    const key = SLOT_KEY[item.kind];
    if (!key) return;
    setActionError(null);
    loadoutMutation.mutate(
      { [key]: item.id },
      {
        onError: (error) => {
          setActionError(error instanceof ApiError ? error.message : 'Erro inesperado');
        },
      },
    );
  }

  function handlePurchase(item: OwnedCosmeticItem) {
    setActionError(null);
    purchaseMutation.mutate(
      { cosmeticItemId: item.id },
      {
        onSuccess: () => handleEquip(item),
        onError: (error) => {
          setActionError(error instanceof ApiError ? error.message : 'Erro inesperado');
        },
      },
    );
  }

  return (
    <section className="bg-navy-light ring-1 ring-silver/10">
      <header className="px-4 py-3 border-b border-silver/10 flex flex-wrap items-center gap-2">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-silver-muted mr-2">
          Armário cosmético
        </h3>
        {KIND_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setKind(tab.id)}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest ring-1 ${
              kind === tab.id
                ? 'bg-ember text-white ring-ember'
                : 'bg-navy-dark text-silver-muted ring-silver/15 hover:ring-ember/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </header>

      <div className="p-4">
        {actionError && (
          <div className="mb-4">
            <Banner variant="error">{actionError}</Banner>
          </div>
        )}

        {cosmeticsQuery.isError && (
          <Banner variant="error">
            {cosmeticsQuery.error instanceof ApiError
              ? cosmeticsQuery.error.message
              : 'Erro inesperado'}
          </Banner>
        )}

        {cosmeticsQuery.isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {!cosmeticsQuery.isLoading && items.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhum item nesta categoria ainda.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((item) => {
            const equipped = isEquipped(item);
            const canAfford = balance >= item.priceInPoints;

            return (
              <article
                key={item.id}
                className={`p-4 bg-navy-dark ring-1 ${
                  equipped ? 'ring-ember' : 'ring-silver/10'
                } flex flex-col gap-3`}
              >
                <div className="h-16 grid place-items-center bg-gradient-to-br from-navy-light to-navy-dark">
                  {item.kind === 'FRAME' ? (
                    <span
                      className={`size-10 grid place-items-center bg-navy-dark font-display italic text-xs ${item.className ?? ''}`}
                    >
                      AE
                    </span>
                  ) : item.kind === 'FONT' ? (
                    <span className={`text-base ${item.className ?? ''}`}>AET</span>
                  ) : item.kind === 'MASCOT' ? (
                    <span className="relative size-10 grid place-items-center bg-navy-dark ring-1 ring-silver/20 font-display italic text-xs">
                      AE
                      {item.emoji && (
                        <span
                          className={`pointer-events-none absolute -bottom-2 -left-3 text-xl ${item.className ?? ''}`}
                          aria-hidden
                        >
                          {item.emoji}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className={`text-xs font-mono uppercase ${item.className ?? ''}`}>
                      {item.name}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold uppercase">{item.name}</p>
                  <p className="text-[10px] text-silver-muted">{item.description}</p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 ring-1 font-mono text-[9px] uppercase tracking-widest ${cosmeticRarityStyle[item.rarity]}`}
                  >
                    {cosmeticRarityLabels[item.rarity]}
                  </span>

                  {equipped ? (
                    <span className="font-mono text-[10px] uppercase text-ember">Equipado</span>
                  ) : item.owned ? (
                    <button
                      type="button"
                      disabled={loadoutMutation.isPending}
                      onClick={() => handleEquip(item)}
                      className="px-3 py-1.5 bg-navy-light ring-1 ring-silver/20 hover:ring-ember/50 font-mono text-[10px] uppercase disabled:opacity-50"
                    >
                      Equipar
                    </button>
                  ) : item.lockedReason ? (
                    <span className="font-mono text-[9px] uppercase text-silver-muted text-right">
                      🔒 {item.lockedReason}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={purchaseMutation.isPending || !canAfford}
                      onClick={() => handlePurchase(item)}
                      className="px-3 py-1.5 bg-ember hover:bg-ember-glow disabled:opacity-40 disabled:hover:bg-ember text-white font-mono text-[10px] uppercase"
                    >
                      {item.priceInPoints.toLocaleString('pt-BR')} pts
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
