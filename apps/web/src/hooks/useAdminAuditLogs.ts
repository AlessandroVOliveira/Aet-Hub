import { useQuery } from '@tanstack/react-query';
import { listAuditLogs } from '@/services/audit-logs';
import { useAuth } from '@/hooks/useAuth';
import type { AuditLogFilters } from '@/types/audit-log';

export function adminAuditLogsQueryKey(filters: AuditLogFilters) {
  return ['admin-audit-logs', filters.action ?? 'ALL', filters.entityType ?? 'ALL'] as const;
}

export function useAdminAuditLogs(filters: AuditLogFilters) {
  const { token } = useAuth();

  return useQuery({
    queryKey: adminAuditLogsQueryKey(filters),
    queryFn: () => listAuditLogs(token as string, filters),
    enabled: !!token,
  });
}
