import type { NewsCategory, Prisma } from '@prisma/client';
import type { NewsArticle } from './feed.news-client.js';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

const newsItemWithCommentCountInclude = {
  _count: { select: { comments: true } },
} satisfies Prisma.NewsItemInclude;

export async function findStalenessInfo(
  tx: Prisma.TransactionClient,
  category: NewsCategory,
): Promise<{ lastFetchedAt: Date | null }> {
  const latest = await tx.newsItem.findFirst({
    where: { category },
    orderBy: { fetchedAt: 'desc' },
    select: { fetchedAt: true },
  });
  return { lastFetchedAt: latest?.fetchedAt ?? null };
}

// createMany + skipDuplicates em vez de upsert por artigo: conteúdo de
// notícia publicada não muda depois de buscada, então não há nada pra
// reconciliar num refetch — dedup fica a cargo do unique [category,
// externalId] (ON CONFLICT DO NOTHING), sem custo de N round trips.
export function insertFetchedArticles(
  tx: Prisma.TransactionClient,
  category: NewsCategory,
  articles: NewsArticle[],
) {
  return tx.newsItem.createMany({
    data: articles.map((article) => ({
      category,
      externalId: article.externalId,
      title: article.title,
      description: article.description,
      url: article.url,
      imageUrl: article.imageUrl,
      sourceDomain: article.sourceDomain,
      publishedAt: article.publishedAt,
    })),
    skipDuplicates: true,
  });
}

// Paginação por cursor (id do último item da página anterior). Ordenação
// composta (publishedAt desc + id desc como desempate) porque vários
// artigos podem ter o mesmo published_at — sem o desempate, o cursor
// poderia pular ou repetir linha em published_at empatado. `take + 1`:
// busca um item a mais só pra saber se existe próxima página, sem
// precisar de um COUNT(*) separado; o service descarta esse extra.
export function listNewsPage(
  tx: Prisma.TransactionClient,
  category: NewsCategory,
  cursor: string | undefined,
  take: number,
) {
  return tx.newsItem.findMany({
    where: { category },
    include: newsItemWithCommentCountInclude,
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

export function findNewsItemById(tx: Prisma.TransactionClient, id: string) {
  return tx.newsItem.findUnique({ where: { id } });
}

// Desc + teto defensivo take:100 (mesmo padrão de
// posts.repository.ts#listCommentsByPost) — o service reverte pra ordem
// cronológica antes de expor.
export function listCommentsByNewsItem(tx: Prisma.TransactionClient, newsItemId: string) {
  return tx.newsComment.findMany({
    where: { newsItemId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export interface CreateNewsCommentData {
  newsItemId: string;
  userId: string;
  authorDisplayName: string;
  content: string;
}

export function createNewsComment(tx: Prisma.TransactionClient, data: CreateNewsCommentData) {
  return tx.newsComment.create({ data });
}

// deleteMany + count em vez de delete(): sob RLS, um comentário alheio dá
// 0 linhas afetadas — delete() estouraria P2025 (not found). deleteMany
// devolve um 404 limpo sem vazar "existe mas não é seu" vs "não existe".
export function deleteNewsCommentByIdForUser(
  tx: Prisma.TransactionClient,
  id: string,
  userId: string,
) {
  return tx.newsComment.deleteMany({ where: { id, userId } });
}
