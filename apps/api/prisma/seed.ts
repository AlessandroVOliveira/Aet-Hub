import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

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

async function main(): Promise<void> {
  for (const game of games) {
    await seedPrisma.game.upsert({ where: { slug: game.slug }, update: {}, create: game });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => seedPrisma.$disconnect());
