import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../modules/auth/jwt.js';
import { withRls } from '../config/rls.js';
import { asyncHandler } from '../utils/async-handler.js';

// Consulta o banco a cada request (não só decodifica o JWT) para banimento
// ter enforcement imediato: um JWT ainda válido de um usuário banido depois
// da emissão precisa parar de funcionar sem esperar o token expirar. Via
// withRls (não `prisma` direto): sem app.current_user_id setado, a RLS de
// users devolveria a linha vazia e todo mundo pareceria banido.
export const requireAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

    if (!token) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    const user = await withRls({ userId: payload.id, role: payload.role }, (tx) =>
      tx.user.findUnique({
        where: { id: payload.id },
        select: { isActive: true, isMuted: true, deletedAt: true },
      }),
    );

    // deletedAt (RF-16) é checado separado de isActive (RF-25) — soft
    // delete e ban são ações independentes e reversíveis cada uma por
    // conta própria; a mesma mensagem genérica cobre os dois casos, sem
    // revelar qual dos dois aconteceu pra quem já tem um JWT válido.
    if (!user || !user.isActive || user.deletedAt) {
      res.status(403).json({ message: 'Sua conta foi suspensa' });
      return;
    }

    req.user = { id: payload.id, role: payload.role, isMuted: user.isMuted };
    next();
  },
);
