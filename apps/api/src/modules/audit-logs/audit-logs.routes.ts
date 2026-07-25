import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/require-role.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { listAuditLogsHandler } from './audit-logs.controller.js';

// RF-06: o log em si (recordAuditLog, utils/audit-log.ts) já é escrito por
// toda ação admin desde as fatias de RF-19/RF-25 — este módulo só expõe a
// leitura, sem escrita própria (nenhuma rota grava aqui).
export const auditLogsRouter = Router();

auditLogsRouter.use(requireAuth, requireRole('ADMIN'));
auditLogsRouter.get('/', asyncHandler(listAuditLogsHandler));
