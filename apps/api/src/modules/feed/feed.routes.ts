import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { createNewsCommentSchema } from './feed.schemas.js';
import {
  createNewsCommentHandler,
  deleteNewsCommentHandler,
  listNewsCommentsHandler,
  listNewsHandler,
} from './feed.controller.js';

// RF-36 — feed de notícias externas (APITube), sem rota admin-only: tudo
// requireAuth, mesmo padrão "tudo autenticado" de communities.routes.ts.
export const feedRouter = Router();

feedRouter.use(requireAuth);

// Instância própria desta fatia — não compartilha orçamento com
// communities/chat (comentário de notícia é uma superfície social distinta).
const writeCommentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user!.id,
  message: { message: 'Muitos comentários em pouco tempo. Aguarde um instante.' },
});

feedRouter.get('/news', asyncHandler(listNewsHandler));
feedRouter.get('/news/:newsItemId/comments', asyncHandler(listNewsCommentsHandler));
feedRouter.post(
  '/news/:newsItemId/comments',
  writeCommentLimiter,
  validateBody(createNewsCommentSchema),
  asyncHandler(createNewsCommentHandler),
);
feedRouter.delete('/comments/:commentId', asyncHandler(deleteNewsCommentHandler));
