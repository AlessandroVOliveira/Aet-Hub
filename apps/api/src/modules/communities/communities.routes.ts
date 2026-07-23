import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/require-role.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { createCommunitySchema, updateCommunitySchema } from './communities.schemas.js';
import {
  createCommunityHandler,
  getCommunityHandler,
  listAllCommunitiesHandler,
  listCommunitiesHandler,
  updateCommunityHandler,
} from './communities.controller.js';
import { createCommentSchema, createPostSchema } from './posts.schemas.js';
import {
  createCommentHandler,
  createPostHandler,
  deleteCommentHandler,
  deletePostHandler,
  getPostDetailHandler,
  likePostHandler,
  listPostsHandler,
  unlikePostHandler,
} from './posts.controller.js';

// Módulo por ator/fluxo, não por tabela do Prisma (ver CLAUDE.md): posts,
// comentários e curtidas atravessam o mesmo recurso de comunidade que o
// CRUD admin, então auth mista por rota dentro de um único router — mesmo
// padrão de store.routes.ts.
export const communitiesRouter = Router();

communitiesRouter.use(requireAuth);

// Rate limit por USUÁRIO (não IP) — mesmo racional de chat.routes.ts
// (eventos presenciais, vários players no mesmo wifi). Instância PRÓPRIA
// desta fatia: orçamento de escrita de comunidade é separado do chat.
const writeContentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user!.id,
  message: { message: 'Muitas publicações em pouco tempo. Aguarde um instante.' },
});

communitiesRouter.get('/', asyncHandler(listCommunitiesHandler));
communitiesRouter.get('/all', requireRole('ADMIN'), asyncHandler(listAllCommunitiesHandler));
communitiesRouter.post(
  '/',
  requireRole('ADMIN'),
  validateBody(createCommunitySchema),
  asyncHandler(createCommunityHandler),
);

// Rotas literais de posts/comentários ANTES de /:id — senão o Express
// tentaria casar "posts"/"comments" como valor de :id.
communitiesRouter.get('/posts/:postId', asyncHandler(getPostDetailHandler));
communitiesRouter.delete('/posts/:postId', asyncHandler(deletePostHandler));
communitiesRouter.post(
  '/posts/:postId/comments',
  writeContentLimiter,
  validateBody(createCommentSchema),
  asyncHandler(createCommentHandler),
);
communitiesRouter.post('/posts/:postId/like', writeContentLimiter, asyncHandler(likePostHandler));
communitiesRouter.delete('/posts/:postId/like', asyncHandler(unlikePostHandler));
communitiesRouter.delete('/comments/:commentId', asyncHandler(deleteCommentHandler));

communitiesRouter.get('/:id', asyncHandler(getCommunityHandler));
communitiesRouter.patch(
  '/:id',
  requireRole('ADMIN'),
  validateBody(updateCommunitySchema),
  asyncHandler(updateCommunityHandler),
);
communitiesRouter.get('/:id/posts', asyncHandler(listPostsHandler));
communitiesRouter.post(
  '/:id/posts',
  writeContentLimiter,
  validateBody(createPostSchema),
  asyncHandler(createPostHandler),
);
