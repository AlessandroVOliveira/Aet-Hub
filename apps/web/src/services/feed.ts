import { apiRequest } from './http';
import type {
  CreateNewsCommentResponse,
  GetNewsCommentsResponse,
  GetNewsResponse,
  NewsCategory,
} from '@/types/feed';

export function getNews(
  token: string,
  category: NewsCategory,
  cursor?: string,
): Promise<GetNewsResponse> {
  const query = cursor
    ? `category=${category}&cursor=${encodeURIComponent(cursor)}`
    : `category=${category}`;
  return apiRequest(`/feed/news?${query}`, { method: 'GET', token });
}

export function getNewsComments(
  token: string,
  newsItemId: string,
): Promise<GetNewsCommentsResponse> {
  return apiRequest(`/feed/news/${newsItemId}/comments`, { method: 'GET', token });
}

export function createNewsComment(
  token: string,
  newsItemId: string,
  content: string,
): Promise<CreateNewsCommentResponse> {
  return apiRequest(`/feed/news/${newsItemId}/comments`, {
    method: 'POST',
    token,
    body: { content },
  });
}

export function deleteNewsComment(token: string, commentId: string): Promise<void> {
  return apiRequest(`/feed/comments/${commentId}`, { method: 'DELETE', token });
}
