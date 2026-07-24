export type ReportedContentType = 'POST' | 'COMMENT' | 'CHAT_MESSAGE' | 'DIRECT_MESSAGE' | 'NEWS_COMMENT';
export type ReportStatus = 'PENDING' | 'DISMISSED';

export interface Report {
  id: string;
  reporterId: string;
  reporterDisplayName: string;
  contentType: ReportedContentType;
  contentId: string;
  reason: string;
  contentSnapshot: string;
  contentAuthorId: string;
  contentAuthorDisplayName: string;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
}

export interface CreateReportPayload {
  contentType: ReportedContentType;
  contentId: string;
  reason: string;
}

export interface CreateReportResponse {
  report: Report;
}

export interface ListReportsResponse {
  reports: Report[];
}
