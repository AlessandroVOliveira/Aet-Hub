import { apiRequest } from './http';
import type { ListReportsResponse, Report, ReportStatus } from '@/types/report';

export function listAllReports(token: string, status?: ReportStatus): Promise<ListReportsResponse> {
  const query = status ? `?status=${status}` : '';
  return apiRequest(`/reports${query}`, { method: 'GET', token });
}

export function dismissReport(token: string, id: string): Promise<{ report: Report }> {
  return apiRequest(`/reports/${id}/dismiss`, { method: 'PATCH', token });
}
