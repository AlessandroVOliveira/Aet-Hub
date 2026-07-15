import type { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Express 4 não encaminha rejeições de Promise para o error handler
// automaticamente (diferente do Express 5) — todo handler assíncrono
// precisa passar por aqui para que erros cheguem ao errorHandler.
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
