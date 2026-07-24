import { useQuery } from '@tanstack/react-query';
import { listAllReports } from '@/services/admin-reports';
import { useAuth } from '@/hooks/useAuth';
import type { ReportStatus } from '@/types/report';

export function adminReportsQueryKey(status?: ReportStatus) {
  return ['admin-reports', status ?? 'ALL'] as const;
}

export function useAdminReports(status?: ReportStatus) {
  const { token } = useAuth();

  return useQuery({
    queryKey: adminReportsQueryKey(status),
    queryFn: () => listAllReports(token as string, status),
    enabled: !!token,
  });
}
