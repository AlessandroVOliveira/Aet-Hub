import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';

// Roda fora de uma request HTTP (sem sessão de usuário para setar
// app.current_role via withRls), então usa a role owner diretamente —
// mesmo padrão que `prisma migrate` já usa para bypassar RLS.
const prismaDir = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(prismaDir, '..', '..', '..', '.env') });

const seedPrisma = new PrismaClient({
  datasources: { db: { url: process.env.MIGRATE_DATABASE_URL } },
});

const games = [
  { name: 'Valorant', slug: 'valorant' },
  { name: 'Counter-Strike 2', slug: 'cs2' },
  { name: 'League of Legends', slug: 'league-of-legends' },
];

// Bootstrap de admin para primeiro uso/testes locais — não há outro jeito
// de criar um ADMIN (cadastro público sempre cria PLAYER, de propósito, ver
// RLS). Overridável via env para não deixar credencial fixa em ambientes
// compartilhados; em dev local sem as vars, cai nos valores padrão abaixo.
const ADMIN_USERNAME = process.env.ADMIN_SEED_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? 'admin123';
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? 'admin@aethub.local';

async function seedAdmin(): Promise<void> {
  const existing = await seedPrisma.user.findUnique({ where: { username: ADMIN_USERNAME } });
  if (existing) {
    return;
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  await seedPrisma.user.create({
    data: {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      termsAcceptedAt: new Date(),
      profile: {
        create: { displayName: 'Admin AET' },
      },
    },
  });

  console.log(`Admin de teste criado: username="${ADMIN_USERNAME}" senha="${ADMIN_PASSWORD}"`);
}

// Uma comunidade por jogo ativo (RF-23) — idempotente via findFirst por
// gameId, já que Community não tem unique constraint em gameId (uma
// comunidade "de assunto" sem jogo é permitida, então gameId sozinho não
// pode ser @unique).
async function seedCommunities(): Promise<void> {
  const activeGames = await seedPrisma.game.findMany({ where: { isActive: true } });

  for (const game of activeGames) {
    const existing = await seedPrisma.community.findFirst({ where: { gameId: game.id } });
    if (existing) continue;

    await seedPrisma.community.create({
      data: {
        name: `Comunidade ${game.name}`,
        description: `Espaço pra trocar ideia, marcar partida e comentar os torneios de ${game.name}.`,
        gameId: game.id,
      },
    });
  }
}

async function main(): Promise<void> {
  for (const game of games) {
    await seedPrisma.game.upsert({ where: { slug: game.slug }, update: {}, create: game });
  }

  await seedAdmin();
  await seedCommunities();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => seedPrisma.$disconnect());
