import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markAllNotificationsRead } from '@/services/notifications';
import { useAuth } from '@/hooks/useAuth';
import { NOTIFICATIONS_QUERY_KEY } from '@/hooks/useNotifications';
import type { ListNotificationsResponse } from '@/types/notification';

// onSuccess só zera unreadCount — os itens em si continuam com o destaque
// visual de não-lida durante a visita (readAt no cache não é reescrito),
// decisão de design: marcar como lida é sobre o CONTADOR do badge, não
// sobre apagar o destaque enquanto a pessoa ainda está na página.
export function useMarkAllNotificationsRead() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(token as string),
    onSuccess: () => {
      queryClient.setQueryData<ListNotificationsResponse>(NOTIFICATIONS_QUERY_KEY, (old) => {
        if (!old) return old;
        return { ...old, unreadCount: 0 };
      });
    },
  });
}
