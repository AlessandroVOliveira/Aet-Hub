import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Em dev, o tsx watch recarrega o módulo a cada mudança de arquivo; sem
// cachear em globalThis, cada reload criaria um novo pool de conexões e
// esgotaria o limite do Postgres rapidamente.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  authPrisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });

// Role aet_hub_auth: escopo estreito, usada só pelo módulo de auth
// (lookup de username no login, criação de conta no cadastro). Nunca
// importar este client fora de modules/auth.
export const authPrisma =
  globalForPrisma.authPrisma ??
  new PrismaClient({ datasources: { db: { url: env.AUTH_DATABASE_URL } } });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.authPrisma = authPrisma;
}

export async function disconnectPrisma(): Promise<void> {
  await Promise.all([prisma.$disconnect(), authPrisma.$disconnect()]);
}
