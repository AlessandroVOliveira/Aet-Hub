import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/services/http';
import { appendChatMessage, CHAT_MESSAGES_QUERY_KEY } from '@/hooks/useChatMessages';
import type { ChatMessage } from '@/types/chat';

interface ChatMessageEvent {
  message: ChatMessage;
}

// Namespace broadcast-only: o cliente nunca emite eventos, só escuta
// 'chat:message'. No 'connect' (cobre a conexão inicial, reconexões e a
// corrida "broadcast antes do GET inicial") invalida a história para
// garantir que o cache reflita o servidor.
export function useChatSocket(token: string | null): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(`${API_BASE_URL}/chat`, { auth: { token } });

    socket.on('connect', () => {
      queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_QUERY_KEY });
    });

    socket.on('chat:message', ({ message }: ChatMessageEvent) => {
      appendChatMessage(queryClient, message);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, queryClient]);
}
