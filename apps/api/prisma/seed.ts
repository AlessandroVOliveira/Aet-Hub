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

// RF-29 — catálogo mínimo (3 conquistas de exemplo), todas avaliadas em
// completeTournament (ver modules/achievements/achievement-evaluator.ts).
// `code` é a chave hardcoded lida pelo avaliador — nunca editável pelo
// admin, só name/description/rarity/isActive.
const achievements = [
  {
    code: 'FIRST_TOURNAMENT',
    name: 'Primeiro Torneio',
    description: 'Concluiu seu primeiro torneio.',
    rarity: 'COMMON' as const,
  },
  {
    code: 'FIRST_WIN',
    name: 'Primeira Vitória',
    description: 'Venceu sua primeira partida.',
    rarity: 'COMMON' as const,
  },
  {
    code: 'CHAMPION',
    name: 'Campeão',
    description: 'Terminou em 1º lugar em um torneio.',
    rarity: 'RARE' as const,
  },
];

// Armário Cosmético (fatia 1: bordas + títulos; fatia 3: fontes + mascotes;
// fatia 4: banners + efeitos) — nomes/preços/raridades portados de
// src-lovable/pixel-palette-pal-07/src/lib/mock.ts, adaptados pros enums
// CosmeticKind/CosmeticRarity do backend. `title-duelista` (unlock por
// conquista) fica de fora: nenhum Achievement.code existente mapeia pra
// ela ainda (decisão de conteúdo em aberto, ver
// memory/project_cosmetic_locker_slice.md) — os itens "lendário" via
// torneio Major/temporada também ficam fora (conceitos que não existem),
// incluindo o mascote "Dragãozinho Brasa" (unlock "Vença um torneio
// Major") e o banner "Aurora do Sul" (descrição "banner animado sazonal"
// — preso ao conceito de temporada/season, mesmo critério). "Sem mascote"/
// "Sem efeito" do mock também ficam de fora: não são itens comprável/
// equipável de catálogo, são só o estado null de equippedMascotId/
// equippedEffectId (mesma semântica de moldura/título sem equip).
const cosmeticItems = [
  {
    kind: 'FRAME' as const,
    name: 'Aço Bruto',
    description: 'Moldura padrão de aço escovado',
    rarity: 'COMMON' as const,
    priceInPoints: 0,
    className: 'ring-2 ring-silver/40',
  },
  {
    kind: 'FRAME' as const,
    name: 'Brasa Viva',
    description: 'Aro em brasa com pulso lento',
    rarity: 'RARE' as const,
    priceInPoints: 2200,
    className: 'ring-2 ring-ember animate-ember-glow',
  },
  {
    kind: 'FRAME' as const,
    name: 'Presa do Lobo',
    description: 'Recortes angulares inspirados no brasão',
    rarity: 'EPIC' as const,
    priceInPoints: 5400,
    className: 'ring-4 ring-fuchsia-400/70',
  },
  {
    kind: 'TITLE' as const,
    name: 'Novato do Pampa',
    description: 'Todo mundo começa aqui',
    rarity: 'COMMON' as const,
    priceInPoints: 0,
  },
  {
    kind: 'TITLE' as const,
    name: 'Rei da LAN',
    description: 'Título de prestígio da casa',
    rarity: 'EPIC' as const,
    priceInPoints: 4500,
  },
  {
    kind: 'FONT' as const,
    name: 'Anton Impacto',
    description: 'Tag em display itálico',
    rarity: 'COMMON' as const,
    priceInPoints: 0,
    className: 'font-display italic',
  },
  {
    kind: 'FONT' as const,
    name: 'Terminal AET',
    description: 'Tag em monoespaçada técnica',
    rarity: 'RARE' as const,
    priceInPoints: 1600,
    className: 'font-mono tracking-tight',
  },
  {
    kind: 'FONT' as const,
    name: 'Placar Wide',
    description: 'Espaçamento largo de arena',
    rarity: 'EPIC' as const,
    priceInPoints: 3900,
    className: 'font-display italic tracking-[0.25em]',
  },
  {
    kind: 'MASCOT' as const,
    name: 'Lobinho AET',
    description: 'O filhote do brasão te acompanha',
    rarity: 'COMMON' as const,
    priceInPoints: 900,
    emoji: '🐺',
    className: 'animate-mascot-bounce',
  },
  {
    kind: 'MASCOT' as const,
    name: 'Mini Lutador',
    description: 'Karateca soltando hadouken',
    rarity: 'RARE' as const,
    priceInPoints: 2600,
    emoji: '🥋',
    className: 'animate-mascot-bounce',
  },
  {
    kind: 'MASCOT' as const,
    name: 'Mini Encanador',
    description: 'Pula sem parar no canto do avatar',
    rarity: 'RARE' as const,
    priceInPoints: 3100,
    emoji: '🍄',
    className: 'animate-mascot-bounce',
  },
  {
    kind: 'MASCOT' as const,
    name: 'Fantasminha Arcade',
    description: 'Flutua de leve ao lado da foto',
    rarity: 'EPIC' as const,
    priceInPoints: 5600,
    emoji: '👻',
    className: 'animate-mascot-float',
  },
  {
    kind: 'MASCOT' as const,
    name: 'Bot de Fronteira',
    description: 'Droide vibrando em stand-by',
    rarity: 'EPIC' as const,
    priceInPoints: 6200,
    emoji: '🤖',
    className: 'animate-mascot-float',
  },
  {
    kind: 'BANNER' as const,
    name: 'Noite Fronteira',
    description: 'Gradiente sóbrio navy',
    rarity: 'COMMON' as const,
    priceInPoints: 0,
    className: 'bg-gradient-to-br from-navy-light to-navy-dark',
  },
  {
    kind: 'BANNER' as const,
    name: 'Chama de Alegrete',
    description: 'Brasa varrendo o card',
    rarity: 'RARE' as const,
    priceInPoints: 2800,
    className: 'bg-gradient-to-br from-ember/40 via-navy-light to-navy-dark',
  },
  {
    kind: 'BANNER' as const,
    name: 'Grid Arcade',
    description: 'Malha retrô com scanline',
    rarity: 'EPIC' as const,
    priceInPoints: 6100,
    className: 'bg-gradient-to-tr from-fuchsia-600/30 via-navy-light to-sky-500/20',
  },
  {
    kind: 'EFFECT' as const,
    name: 'Scanline CRT',
    description: 'Varredura sobre o card',
    rarity: 'RARE' as const,
    priceInPoints: 2400,
    className: 'animate-scanline',
  },
  {
    kind: 'EFFECT' as const,
    name: 'Brasa Pulsante',
    description: 'Brilho ember na tag',
    rarity: 'EPIC' as const,
    priceInPoints: 5200,
    className: 'text-ember animate-ember-glow',
  },
];

async function seedCosmeticItems(): Promise<void> {
  for (const item of cosmeticItems) {
    await seedPrisma.cosmeticItem.upsert({
      where: { kind_name: { kind: item.kind, name: item.name } },
      update: {},
      create: item,
    });
  }
}

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
  for (const achievement of achievements) {
    await seedPrisma.achievement.upsert({
      where: { code: achievement.code },
      update: {},
      create: achievement,
    });
  }

  await seedCosmeticItems();
  await seedAdmin();
  await seedCommunities();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => seedPrisma.$disconnect());
