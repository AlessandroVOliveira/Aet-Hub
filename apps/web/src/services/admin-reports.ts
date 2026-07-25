import { apiRequest } from './http';
import type { ListReportsResponse, Report, ReportStatus } from '@/types/report';

export function listAllReports(token: string, status?: ReportStatus): Promise<ListReportsResponse> {
  const query = status ? `?status=${status}` : '';
  return apiRequest(`/reports${query}`, { method: 'GET', token });
}

export function dismissReport(token: string, id: string): Promise<{ report: Report }> {
  return apiRequest(`/reports/${id}/dismiss`, { method: 'PATCH', token });
}

export function removeReportContent(
  token: string,
  id: string,
  reason: string,
): Promise<{ report: Report }> {
  return apiRequest(`/reports/${id}/remove-content`, { method: 'PATCH', token, body: { reason } });
}

export function banReportAuthor(
  token: string,
  id: string,
  reason: string,
): Promise<{ report: Report }> {
  return apiRequest(`/reports/${id}/ban-author`, { method: 'PATCH', token, body: { reason } });
}

export function muteReportAuthor(
  token: string,
  id: string,
  reason: string,
): Promise<{ report: Report }> {
  return apiRequest(`/reports/${id}/mute-author`, { method: 'PATCH', token, body: { reason } });
}
