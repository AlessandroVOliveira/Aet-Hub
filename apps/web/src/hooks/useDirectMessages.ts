import { useQuery, type QueryClient } from '@tanstack/react-query';
import { getDirectMessages } from '@/services/chat';
import { useAuth } from '@/hooks/useAuth';
import type { DirectMessage, ListDirectMessagesResponse } from '@/types/chat';

export function directMessagesQueryKey(otherUserId: string) {
  return ['direct-messages', otherUserId] as const;
}

export function useDirectMessages(otherUserId: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: directMessagesQueryKey(otherUserId),
    queryFn: () => getDirectMessages(token as string, otherUserId),
    enabled: !!token,
  });
}

// Clone de appendChatMessage (useChatMessages.ts): mensagem própria pode
// chegar pelos dois caminhos (resposta da mutation E broadcast do socket),
// e o socket pode reconectar e reemitir. Dedupe por `id` é a única guarda;
// nunca "desligar" um dos dois caminhos. Se o cache ainda não existe (query
// inicial não resolveu), retorna `old` intacto — não cria um cache parcial
// fora do formato de ListDirectMessagesResponse.
export function appendDirectMessage(
  queryClient: QueryClient,
  otherUserId: string,
  message: DirectMessage,
): void {
  queryClient.setQueryData<ListDirectMessagesResponse>(
    directMessagesQueryKey(otherUserId),
    (old) => {
      if (!old) return old;
      if (old.messages.some((existing) => existing.id === message.id)) return old;
      return { messages: [...old.messages, message] };
    },
  );
}
