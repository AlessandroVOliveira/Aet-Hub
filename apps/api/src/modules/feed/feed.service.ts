import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import { findProfileByUserId } from '../users/users.repository.js';
import * as feedNewsClient from './feed.news-client.js';
import * as feedRepository from './feed.repository.js';
import type { CreateNewsCommentInput } from './feed.schemas.js';

const NEWS_REFRESH_TTL_MS = 25 * 60 * 1000;

// Primeira página é maior (o "topo" que o player vê ao abrir a Home);
// páginas seguintes ("Ver mais antigas") são menores — tamanho fixo no
// backend, não controlado pelo cliente, pra não virar uma válvula de
// scraping em massa do cache.
const FIRST_PAGE_SIZE = 9;
const NEXT_PAGE_SIZE = 3;

export interface NewsPage {
  newsItems: NewsItemView[];
  nextCursor: string | null;
}

export interface NewsItemView {
  id: string;
  category: 'GENERAL' | 'ESPORTS';
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  sourceDomain: string | null;
  publishedAt: Date;
  commentCount: number;
}

function toNewsItemView(item: {
  id: string;
  category: 'GENERAL' | 'ESPORTS';
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  sourceDomain: string | null;
  publishedAt: Date;
  _count: { comments: number };
}): NewsItemView {
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    description: item.description,
    url: item.url,
    imageUrl: item.imageUrl,
    sourceDomain: item.sourceDomain,
    publishedAt: item.publishedAt,
    commentCount: item._count.comments,
  };
}

async function refreshNewsInBackground(
  rlsCtx: { userId: string; role: AccessTokenPayload['role'] },
  category: 'GENERAL' | 'ESPORTS',
): Promise<void> {
  const articles = await feedNewsClient.fetchNewsArticles(category).catch(() => []);
  if (articles.length === 0) {
    return;
  }

  // Mesmo fail-open do fetch: um artigo com formato inesperado nunca deve
  // derrubar a Home. Se o insert falhar, só loga — não há request esperando
  // essa promise pra propagar o erro.
  await withRls(rlsCtx, (tx) => feedRepository.insertFetchedArticles(tx, category, articles)).catch(
    (error) => {
      console.error('[feed] falha ao gravar notícias buscadas em background', error);
    },
  );
}

// Refresh-se-obsoleto: (a) checagem de staleness em transação curta, (b)
// fetch externo + upsert disparados em BACKGROUND (sem await) — a resposta
// nunca espera a freenewsapi.io, só o que já está em cache; quem gatilha o
// refresh não vê as notícias novíssimas nessa mesma carga, só na próxima
// vez que a query rodar. (c) leitura das linhas atuais — SEMPRE roda,
// refresh tendo disparado ou não. Fail-open continua valendo (erro de rede/
// insert só loga, nunca propaga): uma freenewsapi.io fora do ar nunca
// impede a Home de mostrar o que já tinha em cache. Refresh só roda na
// PRIMEIRA página (cursor ausente) — "Ver mais antigas" é só leitura do
// que já está no cache, nunca precisa (nem deveria) buscar notícia nova
// pra isso.
export async function listNews(
  actor: AccessTokenPayload,
  category: 'GENERAL' | 'ESPORTS',
  cursor?: string,
): Promise<NewsPage> {
  const rlsCtx = { userId: actor.id, role: actor.role };
  const isFirstPage = !cursor;

  if (isFirstPage) {
    const { lastFetchedAt } = await withRls(rlsCtx, (tx) =>
      feedRepository.findStalenessInfo(tx, category),
    );
    const isStale = !lastFetchedAt || Date.now() - lastFetchedAt.getTime() > NEWS_REFRESH_TTL_MS;

    if (isStale) {
      void refreshNewsInBackground(rlsCtx, category);
    }
  }

  const take = isFirstPage ? FIRST_PAGE_SIZE : NEXT_PAGE_SIZE;
  const rows = await withRls(rlsCtx, (tx) =>
    feedRepository.listNewsPage(tx, category, cursor, take),
  );

  // listNewsPage busca take+1 só pra saber se existe próxima página —
  // "não seria permitido carregar mais" (chão do cache) vira nextCursor
  // null assim que a query devolver take ou menos linhas.
  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;

  return {
    newsItems: page.map(toNewsItemView),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export async function listNewsComments(actor: AccessTokenPayload, newsItemId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const newsItem = await feedRepository.findNewsItemById(tx, newsItemId);
    if (!newsItem) {
      throw new AppError('Notícia não encontrada', 404);
    }

    const comments = await feedRepository.listCommentsByNewsItem(tx, newsItemId);
    // listCommentsByNewsItem busca desc (teto defensivo take:100) —
    // reverte aqui pra ordem cronológica, mesmo padrão de
    // posts.service.ts#getPostDetail.
    return comments.reverse();
  });
}

// Sem notificação: ao contrário de POST_COMMENT (comunidades), NewsItem não
// tem userId — não existe destinatário legítimo pra app_create_notification
// autorizar (ver CLAUDE.md/plano desta fatia).
export async function createNewsComment(
  actor: AccessTokenPayload,
  newsItemId: string,
  input: CreateNewsCommentInput,
) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const newsItem = await feedRepository.findNewsItemById(tx, newsItemId);
    if (!newsItem) {
      throw new AppError('Notícia não encontrada', 404);
    }

    const profile = await findProfileByUserId(tx, actor.id);
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    return feedRepository.createNewsComment(tx, {
      newsItemId,
      userId: actor.id,
      authorDisplayName: profile.displayName,
      content: input.content,
    });
  });
}

export async function deleteNewsComment(actor: AccessTokenPayload, commentId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const { count } = await feedRepository.deleteNewsCommentByIdForUser(tx, commentId, actor.id);
    if (count === 0) {
      throw new AppError('Comentário não encontrado', 404);
    }
  });
}
