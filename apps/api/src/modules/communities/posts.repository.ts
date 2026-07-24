import type { Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui. NUNCA incluir `user`/`post.user` —
// relação obrigatória sob RLS quebra o Prisma se a linha ficar invisível
// (ver CLAUDE.md); authorDisplayName já é snapshot no INSERT.
const postCountsInclude = {
  _count: { select: { comments: true, likes: true } },
} satisfies Prisma.PostInclude;

export function listPostsByCommunity(tx: Prisma.TransactionClient, communityId: string) {
  return tx.post.findMany({
    where: { communityId },
    include: postCountsInclude,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export function findPostById(tx: Prisma.TransactionClient, id: string) {
  return tx.post.findUnique({ where: { id }, include: postCountsInclude });
}

export interface CreatePostData {
  communityId: string;
  userId: string;
  authorDisplayName: string;
  content: string;
}

export function createPost(tx: Prisma.TransactionClient, data: CreatePostData) {
  return tx.post.create({ data, include: postCountsInclude });
}

// deleteMany + count em vez de delete(): sob RLS, um post alheio dá 0
// linhas afetadas — delete() estouraria P2025 (not found). deleteMany
// devolve um 404 limpo sem vazar "existe mas não é seu" vs "não existe".
export function deletePostByIdForUser(tx: Prisma.TransactionClient, id: string, userId: string) {
  return tx.post.deleteMany({ where: { id, userId } });
}

// Desc + teto defensivo take:100 (sem paginação real, mesmo padrão do
// chat) — o service reverte pra ordem cronológica antes de expor.
export function listCommentsByPost(tx: Prisma.TransactionClient, postId: string) {
  return tx.comment.findMany({ where: { postId }, orderBy: { createdAt: 'desc' }, take: 100 });
}

export interface CreateCommentData {
  postId: string;
  userId: string;
  authorDisplayName: string;
  content: string;
}

export function createComment(tx: Prisma.TransactionClient, data: CreateCommentData) {
  return tx.comment.create({ data });
}

export function deleteCommentByIdForUser(tx: Prisma.TransactionClient, id: string, userId: string) {
  return tx.comment.deleteMany({ where: { id, userId } });
}

export function findCommentById(tx: Prisma.TransactionClient, id: string) {
  return tx.comment.findUnique({ where: { id } });
}

export function findLikedPostIds(tx: Prisma.TransactionClient, userId: string, postIds: string[]) {
  return tx.postLike.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });
}

export function createLike(tx: Prisma.TransactionClient, data: { postId: string; userId: string }) {
  return tx.postLike.create({ data });
}

export function deleteLike(tx: Prisma.TransactionClient, postId: string, userId: string) {
  return tx.postLike.deleteMany({ where: { postId, userId } });
}
