import { apiRequest } from './http';
import type {
  ListChatMessagesResponse,
  SendChatMessageResponse,
  ListConversationsResponse,
  ListDirectMessagesResponse,
  SendDirectMessageResponse,
} from '@/types/chat';

export function getChatMessages(token: string): Promise<ListChatMessagesResponse> {
  return apiRequest('/chat/messages', { method: 'GET', token });
}

export function sendChatMessage(token: string, content: string): Promise<SendChatMessageResponse> {
  return apiRequest('/chat/messages', { method: 'POST', token, body: { content } });
}

export function getConversations(token: string): Promise<ListConversationsResponse> {
  return apiRequest('/chat/conversations', { method: 'GET', token });
}

export function getDirectMessages(
  token: string,
  otherUserId: string,
): Promise<ListDirectMessagesResponse> {
  return apiRequest(`/chat/conversations/${otherUserId}/messages`, { method: 'GET', token });
}

export function sendDirectMessage(
  token: string,
  otherUserId: string,
  content: string,
): Promise<SendDirectMessageResponse> {
  return apiRequest(`/chat/conversations/${otherUserId}/messages`, {
    method: 'POST',
    token,
    body: { content },
  });
}
