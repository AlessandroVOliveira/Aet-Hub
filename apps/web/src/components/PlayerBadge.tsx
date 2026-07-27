import { cosmeticRarityStyle } from '@/utils/format';
import type { CosmeticRarity } from '@/types/cosmetic';

interface PlayerBadgeProps {
  initial: string;
  frameClassName?: string | null;
  titleName?: string | null;
  titleRarity?: CosmeticRarity | null;
}

// Avatar compacto (iniciais) com anel da borda equipada + chip de título —
// armário cosmético fatia 2. Reaproveitado em ranking/chave/chat/comunidade,
// nenhuma dessas telas tinha elemento de avatar antes desta fatia (só
// /perfil e /perfil/:userId, que continuam com o avatar grande próprio).
export function PlayerBadge({ initial, frameClassName, titleName, titleRarity }: PlayerBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span
        className={`size-6 shrink-0 grid place-items-center bg-ember/20 font-display italic text-[10px] ${frameClassName ?? 'ring-1 ring-silver/20'}`}
      >
        {initial.toUpperCase()}
      </span>
      {titleName && titleRarity && (
        <span
          className={`shrink-0 px-1.5 py-0.5 ring-1 font-mono text-[9px] uppercase tracking-widest ${cosmeticRarityStyle[titleRarity]}`}
        >
          {titleName}
        </span>
      )}
    </span>
  );
}
