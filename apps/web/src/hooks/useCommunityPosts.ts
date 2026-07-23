import { useQuery } from '@tanstack/react-query';
import { getCommunityPosts } from '@/services/communities';
import { useAuth } from '@/hooks/useAuth';

export const communityPostsQueryKey = (communityId: string) =>
  ['community-posts', communityId] as const;

export function useCommunityPosts(communityId: string | undefined) {
  const { token } = useAuth();

  return useQuery({
    queryKey: communityPostsQueryKey(communityId ?? ''),
    queryFn: () => getCommunityPosts(token as string, communityId as string),
    enabled: !!token && !!communityId,
  });
}
