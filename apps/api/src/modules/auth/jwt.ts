import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../../config/env.js';

export interface AccessTokenPayload {
  id: string;
  role: Role;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    // @types/jsonwebtoken tipa expiresIn como um template literal restrito
    // (ex: "1d"); JWT_EXPIRES_IN vem do .env como string genérica validada
    // em runtime, não em tipo — o cast só alinha o TS ao formato que o
    // jsonwebtoken já aceita e valida ele mesmo via `ms`.
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (typeof decoded === 'string' || !('id' in decoded) || !('role' in decoded)) {
    throw new Error('Token inválido');
  }

  return { id: String(decoded.id), role: decoded.role as Role };
}
