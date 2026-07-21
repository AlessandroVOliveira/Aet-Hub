import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateRedemptionStatus } from '@/services/admin-store';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_STORE_ITEMS_QUERY_KEY } from '@/hooks/useAdminStoreItems';
import { STORE_ITEMS_QUERY_KEY } from '@/hooks/useStoreItems';
import type { UpdateRedemptionStatusPayload } from '@/types/store';

// Não invalida MY_REDEMPTIONS_QUERY_KEY/MY_WALLET_QUERY_KEY: essas chaves
// são sempre do usuário logado (o admin), não do dono do resgate — sem
// socket neste módulo, o jogador só vê o saldo/histórico atualizado num
// refetch/reload próprio depois que o admin cumpre ou cancela.
export function useUpdateRedemptionStatus() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRedemptionStatusPayload }) =>
      updateRedemptionStatus(token as string, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-redemptions'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_STORE_ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STORE_ITEMS_QUERY_KEY });
    },
  });
}
