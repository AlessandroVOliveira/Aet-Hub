import { withRls } from '../../config/rls.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as auditLogsRepository from './audit-logs.repository.js';
import type { AuditLogFilters } from './audit-logs.repository.js';

export function listAuditLogs(actor: AccessTokenPayload, filters: AuditLogFilters) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    auditLogsRepository.listAuditLogs(tx, filters),
  );
}
