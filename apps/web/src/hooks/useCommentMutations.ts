import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment, deleteComment } from '@/services/communities';
import { useAuth } from '@/hooks/useAuth';
import { communityPostsQueryKey } from '@/hooks/useCommunityPosts';
import { postDetailQueryKey } from '@/hooks/usePostDetail';

// Recebe communityId (não só postId): commentCount exibido na lista de
// posts da comunidade também precisa invalidar.
export function useCreateComment(communityId: string, postId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => createComment(token as string, postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postDetailQueryKey(postId) });
      queryClient.invalidateQueries({ queryKey: communityPostsQueryKey(communityId) });
    },
  });
}

export function useDeleteComment(communityId: string, postId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(token as string, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postDetailQueryKey(postId) });
      queryClient.invalidateQueries({ queryKey: communityPostsQueryKey(communityId) });
    },
  });
}
