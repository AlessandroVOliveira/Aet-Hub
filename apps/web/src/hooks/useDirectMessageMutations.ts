import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendDirectMessage } from '@/services/chat';
import { useAuth } from '@/hooks/useAuth';
import { appendDirectMessage } from '@/hooks/useDirectMessages';
import { conversationFromDirectMessage, upsertConversation } from '@/hooks/useConversations';

export function useSendDirectMessage(otherUserId: string) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => sendDirectMessage(token as string, otherUserId, content),
    onSuccess: (response) => {
      // Duplo caminho com o socket é proposital (mesmo padrão do chat
      // geral) — o dedupe de appendDirectMessage cobre a chegada repetida
      // via broadcast, e isso garante a UI atualizada mesmo se o socket
      // estiver momentaneamente caído.
      appendDirectMessage(queryClient, otherUserId, response.message);
      upsertConversation(
        queryClient,
        conversationFromDirectMessage(response.message, user!.id),
      );
    },
  });
}
