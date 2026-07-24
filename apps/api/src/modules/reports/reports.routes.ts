import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/require-role.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { createReportSchema } from './reports.schemas.js';
import {
  createReportHandler,
  dismissReportHandler,
  listReportsHandler,
} from './reports.controller.js';

// Módulo por ator/fluxo (RF-40, Fatia A): player denuncia, admin vê a fila e
// dispensa — um único model, ciclo de vida em dois atores acoplados, mesmo
// padrão de store/communities (auth mista por rota num só router).
export const reportsRouter = Router();

reportsRouter.use(requireAuth);

// Rate limit por USUÁRIO (não IP), instância própria (não compartilhada com
// chat/communities) — orçamento de denúncia é separado do de conteúdo.
const createReportLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user!.id,
  message: { message: 'Muitas denúncias em pouco tempo. Aguarde um instante.' },
});

reportsRouter.post(
  '/',
  createReportLimiter,
  validateBody(createReportSchema),
  asyncHandler(createReportHandler),
);
reportsRouter.get('/', requireRole('ADMIN'), asyncHandler(listReportsHandler));
reportsRouter.patch('/:id/dismiss', requireRole('ADMIN'), asyncHandler(dismissReportHandler));
