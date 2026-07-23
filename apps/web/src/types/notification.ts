export type NotificationType =
  | 'MATCH_READY'
  | 'DIRECT_MESSAGE'
  | 'REDEMPTION_UPDATED'
  | 'TOURNAMENT_COMPLETED';

// Nome AppNotification de propósito: `Notification` colide silenciosamente
// com o tipo DOM global (window.Notification) — usar esse nome causaria
// erros de tipagem confusos em qualquer arquivo que também toque a API de
// notificações do navegador.
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkPath: string;
  refId: string;
  readAt: string | null;
  createdAt: string;
}

export interface ListNotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export interface MarkNotificationsReadResponse {
  updatedCount: number;
}
