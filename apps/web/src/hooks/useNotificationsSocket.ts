import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/services/http';
import { NOTIFICATIONS_QUERY_KEY, prependNotification } from '@/hooks/useNotifications';
import type { AppNotification } from '@/types/notification';

interface NotificationNewEvent {
  notification: AppNotification;
}

// Espelho de useChatSocket/useDirectMessagesSocket: mesmo namespace /chat,
// broadcast-only, mesma sala `user:{id}` que o servidor já usa pra DM.
// Dívida registrada (fora de escopo desta fatia): isso abre uma TERCEIRA
// conexão socket ao mesmo namespace quando o usuário também está com o
// chat geral ou mensagens privadas montados — consolidar numa única
// conexão compartilhada por um provider de nível de app é melhoria futura.
export function useNotificationsSocket(token: string | null): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(`${API_BASE_URL}/chat`, { auth: { token } });

    socket.on('connect', () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    });

    socket.on('notification:new', ({ notification }: NotificationNewEvent) => {
      prependNotification(queryClient, notification);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, queryClient]);
}
