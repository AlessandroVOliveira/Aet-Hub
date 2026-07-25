import { apiRequest } from './http';
import type { AuditLogFilters, ListAuditLogsResponse } from '@/types/audit-log';

export function listAuditLogs(
  token: string,
  filters: AuditLogFilters,
): Promise<ListAuditLogsResponse> {
  const params = new URLSearchParams();
  if (filters.action) params.set('action', filters.action);
  if (filters.entityType) params.set('entityType', filters.entityType);
  const query = params.toString();
  return apiRequest(`/audit-logs${query ? `?${query}` : ''}`, { method: 'GET', token });
}
