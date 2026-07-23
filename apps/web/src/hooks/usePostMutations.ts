import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost, deletePost, likePost, unlikePost } from '@/services/communities';
import { useAuth } from '@/hooks/useAuth';
import { COMMUNITIES_QUERY_KEY } from '@/hooks/useCommunities';
import { communityPostsQueryKey } from '@/hooks/useCommunityPosts';
import { postDetailQueryKey } from '@/hooks/usePostDetail';

// Invalida communities junto (não só community-posts): postCount exibido
// nos cards de /comunidade muda a cada post criado/excluído.
export function useCreatePost(communityId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => createPost(token as string, communityId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityPostsQueryKey(communityId) });
      queryClient.invalidateQueries({ queryKey: COMMUNITIES_QUERY_KEY });
    },
  });
}

export function useDeletePost(communityId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => deletePost(token as string, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityPostsQueryKey(communityId) });
      queryClient.invalidateQueries({ queryKey: COMMUNITIES_QUERY_KEY });
    },
  });
}

export function useLikePost(communityId: string, postId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => likePost(token as string, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityPostsQueryKey(communityId) });
      queryClient.invalidateQueries({ queryKey: postDetailQueryKey(postId) });
    },
  });
}

export function useUnlikePost(communityId: string, postId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unlikePost(token as string, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityPostsQueryKey(communityId) });
      queryClient.invalidateQueries({ queryKey: postDetailQueryKey(postId) });
    },
  });
}
