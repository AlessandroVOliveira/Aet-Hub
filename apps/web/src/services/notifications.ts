import { apiRequest } from './http';
import type { ListNotificationsResponse, MarkNotificationsReadResponse } from '@/types/notification';

export function getNotifications(token: string): Promise<ListNotificationsResponse> {
  return apiRequest('/notifications', { method: 'GET', token });
}

export function markAllNotificationsRead(token: string): Promise<MarkNotificationsReadResponse> {
  return apiRequest('/notifications/read', { method: 'POST', token });
}
