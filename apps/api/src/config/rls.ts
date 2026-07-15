import { Prisma, type Role } from '@prisma/client';
import { prisma } from './prisma.js';

interface RlsContext {
  userId?: string;
  role?: Role | 'anonymous';
}

// As policies de RLS do Postgres leem current_setting('app.current_user_id')
// e current_setting('app.current_role'). SET LOCAL só vale dentro de uma
// transação presa à mesma conexão física, e o Prisma usa um pool — por
// isso o set_config precisa rodar dentro de $transaction (transação
// interativa), que fixa uma única conexão até o callback terminar.
export function withRls<T>(
  ctx: RlsContext,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${ctx.userId ?? ''}, true)`;
    await tx.$executeRaw`SELECT set_config('app.current_role', ${ctx.role ?? 'anonymous'}, true)`;
    return fn(tx);
  });
}
