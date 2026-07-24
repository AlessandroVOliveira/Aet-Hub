import { useMutation } from '@tanstack/react-query';
import { createReport } from '@/services/reports';
import { useAuth } from '@/hooks/useAuth';
import type { CreateReportPayload } from '@/types/report';

// Sem invalidação de query: nesta fatia (RF-40, Fatia A) o conteúdo
// denunciado não muda — só a fila do admin (Fatia B cuida de ações reais).
export function useReportMutation() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: (payload: CreateReportPayload) => createReport(token as string, payload),
  });
}
