import { useQuery, type QueryClient } from '@tanstack/react-query';
import { getNotifications } from '@/services/notifications';
import { useAuth } from '@/hooks/useAuth';
import type { AppNotification, ListNotificationsResponse } from '@/types/notification';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

export function useNotifications() {
  const { token } = useAuth();

  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => getNotifications(token as string),
    enabled: !!token,
  });
}

// Mesmas regras de appendChatMessage (dedupe por id, cache `undefined`
// fica intacto), mas PREPEND (a lista é desc, mais recente primeiro) e
// incrementa unreadCount só se a notificação chegou não-lida — cobre tanto
// o broadcast do socket quanto uma eventual reconciliação futura sem
// duplicar contagem.
export function prependNotification(queryClient: QueryClient, notification: AppNotification): void {
  queryClient.setQueryData<ListNotificationsResponse>(NOTIFICATIONS_QUERY_KEY, (old) => {
    if (!old) return old;
    if (old.notifications.some((existing) => existing.id === notification.id)) return old;
    return {
      notifications: [notification, ...old.notifications],
      unreadCount: notification.readAt === null ? old.unreadCount + 1 : old.unreadCount,
    };
  });
}
