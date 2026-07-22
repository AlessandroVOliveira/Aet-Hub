import { apiRequest } from './http';
import type { ListChatMessagesResponse, SendChatMessageResponse } from '@/types/chat';

export function getChatMessages(token: string): Promise<ListChatMessagesResponse> {
  return apiRequest('/chat/messages', { method: 'GET', token });
}

export function sendChatMessage(token: string, content: string): Promise<SendChatMessageResponse> {
  return apiRequest('/chat/messages', { method: 'POST', token, body: { content } });
}
