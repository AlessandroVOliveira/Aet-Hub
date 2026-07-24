import type { Prisma, ReportedContentType, ReportStatus } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

export interface CreateReportData {
  reporterId: string;
  reporterDisplayName: string;
  contentType: ReportedContentType;
  contentId: string;
  reason: string;
  contentSnapshot: string;
  contentAuthorId: string;
  contentAuthorDisplayName: string;
}

export function createReport(tx: Prisma.TransactionClient, data: CreateReportData) {
  return tx.report.create({ data });
}

// Sem paginação real ainda (mesmo padrão de listAllRedemptions) — só um
// teto defensivo, volume esperado é baixo nesta fatia.
export function listReports(tx: Prisma.TransactionClient, status?: ReportStatus) {
  return tx.report.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export function findReportById(tx: Prisma.TransactionClient, id: string) {
  return tx.report.findUnique({ where: { id } });
}

export interface DismissReportData {
  status: ReportStatus;
  reviewedAt: Date;
  reviewedByUserId: string;
}

export function updateReportStatus(
  tx: Prisma.TransactionClient,
  id: string,
  data: DismissReportData,
) {
  return tx.report.update({ where: { id }, data });
}
