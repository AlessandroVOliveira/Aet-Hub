import type { Request, Response } from 'express';
import { ReportStatus } from '@prisma/client';
import * as reportsService from './reports.service.js';
import type { CreateReportInput } from './reports.schemas.js';

export async function createReportHandler(req: Request, res: Response): Promise<void> {
  const report = await reportsService.createReport(req.user!, req.body as CreateReportInput);
  res.status(201).json({ report });
}

const VALID_REPORT_STATUSES = new Set(Object.values(ReportStatus));

export async function listReportsHandler(req: Request, res: Response): Promise<void> {
  const rawStatus = req.query.status;
  const status =
    typeof rawStatus === 'string' && VALID_REPORT_STATUSES.has(rawStatus as ReportStatus)
      ? (rawStatus as ReportStatus)
      : undefined;
  const reports = await reportsService.listReports(req.user!, status);
  res.status(200).json({ reports });
}

export async function dismissReportHandler(req: Request, res: Response): Promise<void> {
  const report = await reportsService.dismissReport(req.user!, req.params.id as string);
  res.status(200).json({ report });
}
