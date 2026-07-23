import { apiRequest } from './http';
import type {
  CreateCommentResponse,
  CreatePostResponse,
  GetCommunitiesResponse,
  GetCommunityResponse,
  GetPostDetailResponse,
  GetPostsResponse,
} from '@/types/community';

export function getCommunities(token: string): Promise<GetCommunitiesResponse> {
  return apiRequest('/communities', { method: 'GET', token });
}

export function getCommunity(token: string, id: string): Promise<GetCommunityResponse> {
  return apiRequest(`/communities/${id}`, { method: 'GET', token });
}

export function getCommunityPosts(token: string, communityId: string): Promise<GetPostsResponse> {
  return apiRequest(`/communities/${communityId}/posts`, { method: 'GET', token });
}

export function createPost(
  token: string,
  communityId: string,
  content: string,
): Promise<CreatePostResponse> {
  return apiRequest(`/communities/${communityId}/posts`, { method: 'POST', token, body: { content } });
}

export function getPostDetail(token: string, postId: string): Promise<GetPostDetailResponse> {
  return apiRequest(`/communities/posts/${postId}`, { method: 'GET', token });
}

export function deletePost(token: string, postId: string): Promise<void> {
  return apiRequest(`/communities/posts/${postId}`, { method: 'DELETE', token });
}

export function likePost(token: string, postId: string): Promise<void> {
  return apiRequest(`/communities/posts/${postId}/like`, { method: 'POST', token });
}

export function unlikePost(token: string, postId: string): Promise<void> {
  return apiRequest(`/communities/posts/${postId}/like`, { method: 'DELETE', token });
}

export function createComment(
  token: string,
  postId: string,
  content: string,
): Promise<CreateCommentResponse> {
  return apiRequest(`/communities/posts/${postId}/comments`, {
    method: 'POST',
    token,
    body: { content },
  });
}

export function deleteComment(token: string, commentId: string): Promise<void> {
  return apiRequest(`/communities/comments/${commentId}`, { method: 'DELETE', token });
}
