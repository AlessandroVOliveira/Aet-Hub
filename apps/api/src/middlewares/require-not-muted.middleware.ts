import type { NextFunction, Request, Response } from 'express';

// Bloqueia só CRIAÇÃO de conteúdo novo (RF-25), não a sessão inteira —
// diferente do ban (que requireAuth já barra globalmente). req.user.isMuted
// já veio populado por requireAuth, então não precisa de query nova aqui.
export function requireNotMuted(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.isMuted) {
    res.status(403).json({ message: 'Sua conta está silenciada e não pode publicar conteúdo novo' });
    return;
  }

  next();
}
