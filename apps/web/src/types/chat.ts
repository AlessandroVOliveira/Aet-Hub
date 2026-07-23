export interface ChatMessage {
  id: string;
  userId: string;
  senderDisplayName: string;
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
