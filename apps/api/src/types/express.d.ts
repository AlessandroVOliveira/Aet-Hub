import type { RequestUser } from '../modules/auth/jwt.js';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export {};
