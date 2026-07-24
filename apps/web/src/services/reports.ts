import { apiRequest } from './http';
import type { CreateReportPayload, CreateReportResponse } from '@/types/report';

export function createReport(
  token: string,
  payload: CreateReportPayload,
): Promise<CreateReportResponse> {
  return apiRequest('/reports', { method: 'POST', token, body: payload });
}
