import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/services/http';
import { appendDirectMessage } from '@/hooks/useDirectMessages';
import {
  conversationFromDirectMessage,
  upsertConversation,
  CONVERSATIONS_QUERY_KEY,
} from '@/hooks/useConversations';
import type { DirectMessage } from '@/types/chat';

interface ChatDmEvent {
  message: DirectMessage;
}

// Mesma conexão socket do chat geral (namespace /chat compartilhado — ver
// useChatSocket.ts), broadcast-only: o cliente nunca emite eventos, só
// escuta 'chat:dm'. No 'connect' (cobre conexão inicial, reconexões e a
// corrida "broadcast antes do GET inicial") invalida tanto a lista de
// conversas quanto TODAS as threads abertas (prefixo ['direct-messages'],
// sem o otherUserId) — ressincroniza tudo de uma vez após reconexão.
export function useDirectMessagesSocket(token: string | null, myUserId: string | undefined): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token || !myUserId) return;

    const socket: Socket = io(`${API_BASE_URL}/chat`, { auth: { token } });

    socket.on('connect', () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['direct-messages'] });
    });

    socket.on('chat:dm', ({ message }: ChatDmEvent) => {
      const otherUserId = message.senderId === myUserId ? message.recipientId : message.senderId;
      appendDirectMessage(queryClient, otherUserId, message);
      upsertConversation(queryClient, conversationFromDirectMessage(message, myUserId));
    });

    return () => {
      socket.disconnect();
    };
  }, [token, myUserId, queryClient]);
}
