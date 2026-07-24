import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dismissReport } from '@/services/admin-reports';
import { useAuth } from '@/hooks/useAuth';

export function useDismissReport() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dismissReport(token as string, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });
}
