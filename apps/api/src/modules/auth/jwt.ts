import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../../config/env.js';

export interface AccessTokenPayload {
  id: string;
  role: Role;
}

// Superset de AccessTokenPayload usado só para tipar req.user (nunca o
// payload assinado no JWT) — isMuted vem de uma consulta ao banco a cada
// request (ver requireAuth), não do token, porque token válido não pode
// ficar stale até expirar. Nome RequestUser, não AuthenticatedUser: esse
// nome já é usado em auth.service.ts para o formato de resposta do login
// ({id, username, role}), um conceito diferente.
export interface RequestUser extends AccessTokenPayload {
  isMuted: boolean;
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
