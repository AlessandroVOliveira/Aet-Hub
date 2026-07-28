import type { Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

// equippedFrame/equippedTitle apontam pra CosmeticItem, catálogo público
// (cosmetic_items_authenticated_select libera qualquer sessão autenticada)
// — sem o gotcha de relação obrigatória + RLS já documentado no projeto
// pra users/profiles, porque não há RLS nenhuma bloqueando essa leitura.
const profileDetailInclude = {
  favoriteGame: { select: { id: true, name: true, slug: true } },
  user: { select: { id: true, username: true, email: true } },
  equippedFrame: true,
  equippedTitle: true,
  equippedFont: true,
  equippedMascot: true,
  equippedBanner: true,
  equippedEffect: true,
} satisfies Prisma.ProfileInclude;

export function findProfileByUserId(tx: Prisma.TransactionClient, userId: string) {
  return tx.profile.findUnique({ where: { userId }, include: profileDetailInclude });
}

export interface ProfileWriteData {
  displayName?: string;
  favoriteGameId?: string | null;
  favoriteCharacter?: string | null;
  theme?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  equippedFrameId?: string | null;
  equippedTitleId?: string | null;
  equippedFontId?: string | null;
  equippedMascotId?: string | null;
  equippedBannerId?: string | null;
  equippedEffectId?: string | null;
}

export function updateProfile(
  tx: Prisma.TransactionClient,
  userId: string,
  data: ProfileWriteData,
) {
  return tx.profile.update({ where: { userId }, data, include: profileDetailInclude });
}

export async function getPointsBalance(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<number> {
  const result = await tx.pointsTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

// Sem paginação real ainda (nenhum outro endpoint do projeto pagina) — só
// um teto defensivo simples.
export function listPointsTransactions(tx: Prisma.TransactionClient, userId: string) {
  return tx.pointsTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

// Shape público seguro reusado por toda leitura/escrita admin de User —
// nunca devolver a linha crua (passwordHash vazaria, bug já corrigido
// uma vez em updateUserModeration). RF-16 acrescentou deletedAt e os
// campos de Profile além de displayName — a tela de edição do admin
// reaproveita a listagem já cacheada em vez de um GET /users/:id novo.
const adminUserSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  isActive: true,
  isMuted: true,
  deletedAt: true,
  createdAt: true,
  profile: {
    select: {
      displayName: true,
      favoriteGameId: true,
      favoriteCharacter: true,
      theme: true,
      avatarUrl: true,
      bio: true,
    },
  },
} satisfies Prisma.UserSelect;

// RF-25 (Fatia B) — tela admin /admin/usuarios. Sem paginação real ainda
// (mesmo padrão de listPointsTransactions/reports.repository#listReports).
export function listAllUsersForAdmin(tx: Prisma.TransactionClient) {
  return tx.user.findMany({
    select: adminUserSelect,
    orderBy: { username: 'asc' },
    take: 500,
  });
}

export function findUserById(tx: Prisma.TransactionClient, id: string) {
  return tx.user.findUnique({ where: { id } });
}

// RF-16: retorno seguro pós-escrita (updateUserByAdmin lê de volta depois
// de aplicar sub-updates em User e/ou Profile, que devolvem shapes
// diferentes entre si).
export function findUserForAdmin(tx: Prisma.TransactionClient, userId: string) {
  return tx.user.findUnique({ where: { id: userId }, select: adminUserSelect });
}

export interface UserModerationData {
  isActive?: boolean;
  isMuted?: boolean;
  deletedAt?: Date | null;
}

// select explícito (nunca a linha inteira): sem isso, passwordHash vazaria
// na resposta de PATCH /users/:id/moderation — mesmo shape público de
// listAllUsersForAdmin acima.
export function updateUserModeration(
  tx: Prisma.TransactionClient,
  userId: string,
  data: UserModerationData,
) {
  return tx.user.update({ where: { id: userId }, data, select: adminUserSelect });
}

// RF-16: username/e-mail não têm nenhuma superfície de edição hoje (nem
// self-service, nem admin) — só o cadastro público os grava.
export interface UserAccountWriteData {
  username?: string;
  email?: string;
}

export function updateUserAccountFields(
  tx: Prisma.TransactionClient,
  userId: string,
  data: UserAccountWriteData,
) {
  return tx.user.update({ where: { id: userId }, data, select: adminUserSelect });
}

// RF-29 — perfil público de terceiros: a RLS de users/profiles só libera
// self/ADMIN/colega-de-torneio, então um terceiro (ex.: a partir do
// /ranking) precisa passar pela função SECURITY DEFINER
// app_public_profile_snapshot (migration public_profile_read_functions) —
// mesma técnica de app_dm_recipient_display_name, fronteira de exposição
// estreita. Linha vazia = usuário não encontrado/banido/excluído (a
// própria função já filtra isso), o service trata como 404.
interface PublicProfileSnapshotRow {
  username: string;
  display_name: string;
  favorite_game_name: string | null;
  favorite_character: string | null;
  theme: string | null;
  equipped_frame_id: string | null;
  equipped_title_id: string | null;
  equipped_font_id: string | null;
  equipped_mascot_id: string | null;
  equipped_banner_id: string | null;
  equipped_effect_id: string | null;
}

export interface PublicProfileSnapshot {
  username: string;
  displayName: string;
  favoriteGameName: string | null;
  favoriteCharacter: string | null;
  theme: string | null;
  equippedFrameId: string | null;
  equippedTitleId: string | null;
  equippedFontId: string | null;
  equippedMascotId: string | null;
  equippedBannerId: string | null;
  equippedEffectId: string | null;
}

export async function findPublicProfileSnapshot(
  tx: Prisma.TransactionClient,
  targetUserId: string,
): Promise<PublicProfileSnapshot | null> {
  const rows = await tx.$queryRaw<PublicProfileSnapshotRow[]>`
    SELECT * FROM app_public_profile_snapshot(${targetUserId})
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    username: row.username,
    displayName: row.display_name,
    favoriteGameName: row.favorite_game_name,
    favoriteCharacter: row.favorite_character,
    theme: row.theme,
    equippedFrameId: row.equipped_frame_id,
    equippedTitleId: row.equipped_title_id,
    equippedFontId: row.equipped_font_id,
    equippedMascotId: row.equipped_mascot_id,
    equippedBannerId: row.equipped_banner_id,
    equippedEffectId: row.equipped_effect_id,
  };
}

// follows_self_select só libera linhas onde a sessão é uma das duas
// partes — um terceiro nunca enxerga o par de outra pessoa nem pra
// contar, daí a função SECURITY DEFINER app_follow_counts (contagem-só,
// sem conteúdo de linha).
export interface FollowCounts {
  followersCount: number;
  followingCount: number;
}

export async function findFollowCounts(
  tx: Prisma.TransactionClient,
  targetUserId: string,
): Promise<FollowCounts> {
  const [row] = await tx.$queryRaw<{ followers_count: bigint; following_count: bigint }[]>`
    SELECT * FROM app_follow_counts(${targetUserId})
  `;
  return {
    followersCount: Number(row?.followers_count ?? 0),
    followingCount: Number(row?.following_count ?? 0),
  };
}
