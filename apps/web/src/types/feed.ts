export type NewsCategory = 'GENERAL' | 'ESPORTS';

export interface NewsItem {
  id: string;
  category: NewsCategory;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  sourceDomain: string | null;
  publishedAt: string;
  commentCount: number;
}

// Nome NewsComment de propósito, NUNCA `Comment` — colide silenciosamente
// com o tipo DOM global (mesma armadilha do AppNotification/PostComment,
// ver CLAUDE.md).
export interface NewsComment {
  id: string;
  newsItemId: string;
  userId: string;
  authorDisplayName: string;
  content: string;
  createdAt: string;
}

export interface GetNewsResponse {
  newsItems: NewsItem[];
  nextCursor: string | null;
}

export interface GetNewsCommentsResponse {
  comments: NewsComment[];
}

export interface CreateNewsCommentResponse {
  comment: NewsComment;
}
