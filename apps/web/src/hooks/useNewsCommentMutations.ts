import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNewsComment, deleteNewsComment } from '@/services/feed';
import { useAuth } from '@/hooks/useAuth';
import { newsQueryKey } from '@/hooks/useNews';
import { newsCommentsQueryKey } from '@/hooks/useNewsComments';
import type { NewsCategory } from '@/types/feed';

// Recebe category (não só newsItemId): commentCount exibido no card do
// feed também precisa invalidar, mesmo racional de useCommentMutations.ts.
export function useCreateNewsComment(category: NewsCategory, newsItemId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => createNewsComment(token as string, newsItemId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsCommentsQueryKey(newsItemId) });
      queryClient.invalidateQueries({ queryKey: newsQueryKey(category) });
    },
  });
}

export function useDeleteNewsComment(category: NewsCategory, newsItemId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteNewsComment(token as string, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsCommentsQueryKey(newsItemId) });
      queryClient.invalidateQueries({ queryKey: newsQueryKey(category) });
    },
  });
}
