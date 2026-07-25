import type { Request, Response } from 'express';
import * as auditLogsService from './audit-logs.service.js';

function queryParam(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export async function listAuditLogsHandler(req: Request, res: Response): Promise<void> {
  const auditLogs = await auditLogsService.listAuditLogs(req.user!, {
    action: queryParam(req.query.action),
    entityType: queryParam(req.query.entityType),
  });
  res.status(200).json({ auditLogs });
}
