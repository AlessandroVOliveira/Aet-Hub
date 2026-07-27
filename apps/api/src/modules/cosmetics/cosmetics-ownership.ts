import type { CosmeticItem } from '@prisma/client';

// Ownership é derivada, nunca duplicada em tabela (mesmo princípio de
// saldo/nível já derivados no projeto): grátis padrão (preço 0, sem
// unlockAchievementCode) OU a conquista vinculada já foi desbloqueada OU
// existe linha de compra em UserCosmeticItem. Pura/testável, mesmo
// espírito de achievement-evaluator.ts/placement-calculator.ts.
export function isCosmeticOwned(
  item: CosmeticItem,
  unlockedAchievementCodes: Set<string>,
  purchasedCosmeticItemIds: Set<string>,
): boolean {
  if (item.priceInPoints === 0 && !item.unlockAchievementCode) {
    return true;
  }
  if (item.unlockAchievementCode && unlockedAchievementCodes.has(item.unlockAchievementCode)) {
    return true;
  }
  return purchasedCosmeticItemIds.has(item.id);
}

export interface AnnotatedCosmeticItem extends CosmeticItem {
  owned: boolean;
  lockedReason: string | null;
}

export function annotateCosmeticOwnership(
  items: CosmeticItem[],
  unlockedAchievementCodes: Set<string>,
  purchasedCosmeticItemIds: Set<string>,
): AnnotatedCosmeticItem[] {
  return items.map((item) => {
    const owned = isCosmeticOwned(item, unlockedAchievementCodes, purchasedCosmeticItemIds);
    return {
      ...item,
      owned,
      lockedReason: !owned && item.unlockAchievementCode ? 'Desbloqueie a conquista associada' : null,
    };
  });
}
