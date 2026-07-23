import { useQuery } from '@tanstack/react-query';
import { getPostDetail } from '@/services/communities';
import { useAuth } from '@/hooks/useAuth';

export const postDetailQueryKey = (postId: string) => ['post', postId] as const;

export function usePostDetail(postId: string | undefined) {
  const { token } = useAuth();

  return useQuery({
    queryKey: postDetailQueryKey(postId ?? ''),
    queryFn: () => getPostDetail(token as string, postId as string),
    enabled: !!token && !!postId,
  });
}
