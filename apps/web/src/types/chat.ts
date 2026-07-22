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
