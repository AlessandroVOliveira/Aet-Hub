import type { CosmeticRarity } from './cosmetic';

export interface ChatMessage {
  id: string;
  userId: string;
  senderDisplayName: string;
  senderFrameClassName: string | null;
  senderTitleName: string | null;
  senderTitleRarity: CosmeticRarity | null;
  // Armário cosmético (fatia 3) — só fonte, sem mascote (mesmo racional de
  // ranking.ts).
  senderFontClassName: string | null;
  content: string;
  createdAt: string;
}

export interface ListChatMessagesResponse {
  messages: ChatMessage[];
}

export interface SendChatMessageResponse {
  message: ChatMessage;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  senderDisplayName: string;
  recipientDisplayName: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  otherUserId: string;
  otherDisplayName: string;
  lastMessageContent: string;
  lastMessageSenderId: string;
  lastMessageAt: string;
}

export interface ListConversationsResponse {
  conversations: Conversation[];
}

export interface ListDirectMessagesResponse {
  messages: DirectMessage[];
}

export interface SendDirectMessageResponse {
  message: DirectMessage;
}
