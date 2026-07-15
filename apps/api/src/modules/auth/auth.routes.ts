import { Router } from 'express';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import { loginHandler, meHandler, registerHandler } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), asyncHandler(registerHandler));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(loginHandler));
authRouter.get('/me', requireAuth, meHandler);
