import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendChatMessageSchema } from './chat.schemas.js';
import { listChatMessagesHandler, sendChatMessageHandler } from './chat.controller.js';

export const chatRouter = Router();

chatRouter.use(requireAuth);

// Rate limit por USUÁRIO (não IP): em evento presencial, dezenas de
// players podem estar no mesmo wifi/NAT — limitar por IP estrangularia o
// evento inteiro. `req.user` já existe aqui porque o limiter é montado
// depois de requireAuth.
const sendMessageLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user!.id,
  message: { message: 'Muitas mensagens em pouco tempo. Aguarde um instante.' },
});

chatRouter.get('/messages', asyncHandler(listChatMessagesHandler));
chatRouter.post(
  '/messages',
  sendMessageLimiter,
  validateBody(sendChatMessageSchema),
  asyncHandler(sendChatMessageHandler),
);
