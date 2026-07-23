import type { Game } from '@/types/game';

export interface Community {
  id: string;
  name: string;
  description: string;
  gameId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  game: Pick<Game, 'id' | 'name' | 'slug'> | null;
  postCount: number;
}

export interface Post {
  id: string;
  communityId: string;
  userId: string;
  authorDisplayName: string;
  content: string;
  createdAt: string;
  commentCount: number;
  likeCount: number;
  likedByMe: boolean;
}

// Nome PostComment de propósito, NUNCA `Comment` — colide silenciosamente
// com o tipo DOM global (mesma armadilha do AppNotification, ver CLAUDE.md).
export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  authorDisplayName: string;
  content: string;
  createdAt: string;
}

export interface GetCommunitiesResponse {
  communities: Community[];
}

export interface GetCommunityResponse {
  community: Community;
}

export interface GetPostsResponse {
  posts: Post[];
}

export interface GetPostDetailResponse {
  post: Post;
  comments: PostComment[];
}

export interface CreatePostResponse {
  post: Post;
}

export interface CreateCommentResponse {
  comment: PostComment;
}

export interface CommunityFormFields {
  name: string;
  description: string;
  gameId: string | null;
  isActive?: boolean;
}

export type CreateCommunityPayload = CommunityFormFields;
export type UpdateCommunityPayload = Partial<CommunityFormFields>;
