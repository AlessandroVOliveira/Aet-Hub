import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseCosmeticItem, updateLoadout } from '@/services/cosmetics';
import { useAuth, ME_QUERY_KEY } from '@/hooks/useAuth';
import { COSMETICS_QUERY_KEY } from '@/hooks/useCosmetics';
import { MY_WALLET_QUERY_KEY } from '@/hooks/useMyWallet';
import type { PurchaseCosmeticItemPayload, UpdateLoadoutPayload } from '@/types/cosmetic';

export function usePurchaseCosmeticItem() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PurchaseCosmeticItemPayload) =>
      purchaseCosmeticItem(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COSMETICS_QUERY_KEY });
      // Compra debita pontos — carteira exibida no header/sidebar precisa
      // refletir o novo saldo (mesmo padrão de useStoreMutations).
      queryClient.invalidateQueries({ queryKey: MY_WALLET_QUERY_KEY });
    },
  });
}

export function useUpdateLoadout() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateLoadoutPayload) => updateLoadout(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COSMETICS_QUERY_KEY });
      // O frame/título equipado também é lido de GET /users/me (ProfilePage
      // fora da aba Personalizar) — precisa refletir sem precisar de F5.
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY(token) });
    },
  });
}
