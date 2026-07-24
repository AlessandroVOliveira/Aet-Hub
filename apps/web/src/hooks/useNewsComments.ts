import { useQuery } from '@tanstack/react-query';
import { getNewsComments } from '@/services/feed';
import { useAuth } from '@/hooks/useAuth';

export const newsCommentsQueryKey = (newsItemId: string) =>
  ['feed-news-comments', newsItemId] as const;

// `enabled` vem do card (só busca quando o card está expandido) — evita
// disparar uma query por notícia visível na Home de uma vez só.
export function useNewsComments(newsItemId: string, enabled: boolean) {
  const { token } = useAuth();

  return useQuery({
    queryKey: newsCommentsQueryKey(newsItemId),
    queryFn: () => getNewsComments(token as string, newsItemId),
    enabled: !!token && !!newsItemId && enabled,
  });
}
