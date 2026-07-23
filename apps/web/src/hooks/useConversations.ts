import { useQuery, type QueryClient } from '@tanstack/react-query';
import { getConversations } from '@/services/chat';
import { useAuth } from '@/hooks/useAuth';
import type { Conversation, DirectMessage, ListConversationsResponse } from '@/types/chat';

export const CONVERSATIONS_QUERY_KEY = ['conversations'] as const;

export function useConversations() {
  const { token } = useAuth();

  return useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: () => getConversations(token as string),
    enabled: !!token,
  });
}

// Deriva o "outro lado" da conversa a partir de uma DirectMessage: quem sou
// eu (myUserId) determina se o outro é o remetente ou o destinatário.
export function conversationFromDirectMessage(
  message: DirectMessage,
  myUserId: string,
): Conversation {
  const iAmSender = message.senderId === myUserId;
  return {
    otherUserId: iAmSender ? message.recipientId : message.senderId,
    otherDisplayName: iAmSender ? message.recipientDisplayName : message.senderDisplayName,
    lastMessageContent: message.content,
    lastMessageSenderId: message.senderId,
    lastMessageAt: message.createdAt,
  };
}

// Mesma regra do appendChatMessage: cache `undefined` (query inicial ainda
// não resolveu) fica intacto, nunca cria um cache parcial fora do formato
// de ListConversationsResponse. Uma conversa nova/atualizada substitui a
// entrada existente com o mesmo otherUserId (se houver) e vai pro topo —
// mesma ordenação (mais recente primeiro) que o backend já devolve.
export function upsertConversation(queryClient: QueryClient, conversation: Conversation): void {
  queryClient.setQueryData<ListConversationsResponse>(CONVERSATIONS_QUERY_KEY, (old) => {
    if (!old) return old;
    const rest = old.conversations.filter((c) => c.otherUserId !== conversation.otherUserId);
    return { conversations: [conversation, ...rest] };
  });
}
