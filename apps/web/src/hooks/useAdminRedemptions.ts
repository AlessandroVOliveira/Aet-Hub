import { useQuery } from '@tanstack/react-query';
import { listAllRedemptions } from '@/services/admin-store';
import { useAuth } from '@/hooks/useAuth';
import type { RedemptionStatus } from '@/types/store';

export function adminRedemptionsQueryKey(status?: RedemptionStatus) {
  return ['admin-redemptions', status ?? 'ALL'] as const;
}

export function useAdminRedemptions(status?: RedemptionStatus) {
  const { token } = useAuth();

  return useQuery({
    queryKey: adminRedemptionsQueryKey(status),
    queryFn: () => listAllRedemptions(token as string, status),
    enabled: !!token,
  });
}
