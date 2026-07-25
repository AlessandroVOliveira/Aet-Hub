import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { followUser, getFollowers, getFollowing, unfollowUser } from '@/services/follows';
import { useAuth } from '@/hooks/useAuth';

export const FOLLOWING_QUERY_KEY = ['follows', 'following'] as const;
export const FOLLOWERS_QUERY_KEY = ['follows', 'followers'] as const;

export function useFollowing() {
  const { token } = useAuth();

  return useQuery({
    queryKey: FOLLOWING_QUERY_KEY,
    queryFn: () => getFollowing(token as string),
    enabled: !!token,
  });
}

export function useFollowers() {
  const { token } = useAuth();

  return useQuery({
    queryKey: FOLLOWERS_QUERY_KEY,
    queryFn: () => getFollowers(token as string),
    enabled: !!token,
  });
}

// Só invalida "following" — meu follow/unfollow nunca muda a minha própria
// lista de seguidores, só a de quem eu sigo.
export function useFollowMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => followUser(token as string, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLLOWING_QUERY_KEY });
    },
  });
}

export function useUnfollowMutation() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => unfollowUser(token as string, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLLOWING_QUERY_KEY });
    },
  });
}
