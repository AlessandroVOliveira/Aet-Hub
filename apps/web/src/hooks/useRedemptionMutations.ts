import { useMutation, useQueryClient } from '@tanstack/react-query';
import { redeemStoreItem } from '@/services/store';
import { useAuth } from '@/hooks/useAuth';
import { STORE_ITEMS_QUERY_KEY } from '@/hooks/useStoreItems';
import { MY_REDEMPTIONS_QUERY_KEY } from '@/hooks/useMyRedemptions';
import { MY_WALLET_QUERY_KEY } from '@/hooks/useMyWallet';
import type { CreateRedemptionPayload } from '@/types/store';

export function useCreateRedemption() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRedemptionPayload) => redeemStoreItem(token as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORE_ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MY_REDEMPTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MY_WALLET_QUERY_KEY });
    },
  });
}
