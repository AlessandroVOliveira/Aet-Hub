import { useQuery, type QueryClient } from '@tanstack/react-query';
import { getChatMessages } from '@/services/chat';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessage, ListChatMessagesResponse } from '@/types/chat';

export const CHAT_MESSAGES_QUERY_KEY = ['chat-messages'] as const;

export function useChatMessages() {
  const { token } = useAuth();

  return useQuery({
    queryKey: CHAT_MESSAGES_QUERY_KEY,
    queryFn: () => getChatMessages(token as string),
    enabled: !!token,
  });
}

// Reusado pela mutation de envio e pelo listener do socket — mensagem
// própria pode chegar pelos dois caminhos (resposta da mutation E
// broadcast), e o socket pode reconectar e reemitir. Dedupe por `id` é a
// única guarda; nunca "desligar" um dos dois caminhos. Se o cache ainda
// não existe (query inicial não resolveu), retorna `old` intacto — não
// cria um cache parcial fora do formato de ListChatMessagesResponse.
export function appendChatMessage(queryClient: QueryClient, message: ChatMessage): void {
  queryClient.setQueryData<ListChatMessagesResponse>(CHAT_MESSAGES_QUERY_KEY, (old) => {
    if (!old) return old;
    if (old.messages.some((existing) => existing.id === message.id)) return old;
    return { messages: [...old.messages, message] };
  });
}
