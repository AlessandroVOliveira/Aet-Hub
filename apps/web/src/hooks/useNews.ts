import { useInfiniteQuery } from '@tanstack/react-query';
import { getNews } from '@/services/feed';
import { useAuth } from '@/hooks/useAuth';
import type { NewsCategory } from '@/types/feed';

export const newsQueryKey = (category: NewsCategory) => ['feed-news', category] as const;

// Paginação por cursor ("Ver mais antigas") — primeira página maior,
// refresh-se-obsoleto só roda nela (ver feed.service.ts#listNews no
// backend); páginas seguintes só leem o cache já existente.
export function useNews(category: NewsCategory) {
  const { token } = useAuth();

  return useInfiniteQuery({
    queryKey: newsQueryKey(category),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getNews(token as string, category, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!token,
  });
}
