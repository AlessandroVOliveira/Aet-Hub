import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendChatMessage } from '@/services/chat';
import { useAuth } from '@/hooks/useAuth';
import { appendChatMessage } from '@/hooks/useChatMessages';

export function useSendChatMessage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => sendChatMessage(token as string, content),
    onSuccess: (response) => {
      appendChatMessage(queryClient, response.message);
    },
  });
}
