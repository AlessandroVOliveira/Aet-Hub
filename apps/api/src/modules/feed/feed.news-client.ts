import type { NewsCategory } from '@prisma/client';
import { env } from '../../config/env.js';

const FREENEWSAPI_BASE_URL = 'https://api.freenewsapi.io/v1';

// Quantidade de artigos buscados por refresh — GET /details é uma
// chamada por artigo (a API não tem endpoint de batch), então este número
// multiplica direto a quantidade de requests por categoria a cada refresh.
const ARTICLES_PER_REFRESH = 8;

// Rate limit apertado descoberto testando contra a API real (~1 req/s —
// disparar em paralelo via Promise.all estourava 429 "Too Many Requests"
// em quase todas as chamadas de /details). As chamadas de detalhe são
// seriais, com esse intervalo entre uma e outra.
const DETAILS_REQUEST_INTERVAL_MS = 1100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface NewsListItem {
  uuid: string;
  title: string;
  published_at: string;
  publisher: string | null;
}

interface NewsListResponse {
  data?: NewsListItem[];
}

interface NewsDetails {
  uuid: string;
  title: string;
  thumbnail: string | null;
  publisher: string | null;
  original_url: string | null;
  incipit: string | null;
  published_at: string;
}

// GET /details devolve o objeto envelopado em `data` (confirmado contra a
// API real) — diferente de GET /news, que devolve o array direto em
// `data`. Sem isso, todo campo (thumbnail/original_url/incipit) vem
// `undefined` e nenhum artigo sobrevive ao filtro de URL no final.
interface NewsDetailsResponse {
  data?: NewsDetails;
}

export interface NewsArticle {
  externalId: string;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  sourceDomain: string | null;
  publishedAt: Date;
}

// `pt-419` é o código real que a API usa pra português do Brasil — não é
// BCP-47 padrão (seria `pt-BR`), é convenção própria da freenewsapi.io:
// confirmado via GET /languages?country=BR (devolve exatamente
// `["pt-419"]"`), mesmo padrão que usam pra `es-419` (espanhol latino-
// americano). RF-03/produto não tem requisito de i18n — o Hub inteiro é
// pt-BR, então o feed também deve trazer só notícia em português.
const LANGUAGE_PT_BR = 'pt-419';

// GENERAL usa o tópico "gaming" do catálogo fixo de /topics; ESPORTS não
// tem tópico próprio nessa API, então busca por palavra-chave no título
// (único parâmetro de busca suportado em /news — `q`/`in_body`/`in_subtitle`
// foram removidos pela própria API).
function buildListParams(category: NewsCategory): URLSearchParams {
  const params = new URLSearchParams({ order_by: 'recent', language: LANGUAGE_PT_BR });
  if (category === 'GENERAL') {
    params.set('topic', 'gaming');
  } else {
    params.set('in_title', 'esports');
  }
  return params;
}

async function fetchJson<T>(path: string, params: URLSearchParams): Promise<T | null> {
  try {
    const response = await fetch(`${FREENEWSAPI_BASE_URL}${path}?${params.toString()}`, {
      headers: { 'x-api-key': env.FREENEWSAPI_API_KEY },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`[feed] freenewsapi.io respondeu ${response.status} em ${path}: ${body}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    // Fail-open: notícia é conteúdo editorial, não um gate de segurança —
    // qualquer falha aqui nunca deve derrubar a Home (diferente do
    // fail-closed de utils/cep.ts, que protege um requisito de cadastro).
    console.error(`[feed] falha ao buscar ${path} na freenewsapi.io`, error);
    return null;
  }
}

function toNewsArticle(item: NewsListItem, details: NewsDetails | null): NewsArticle {
  return {
    externalId: item.uuid,
    title: item.title,
    description: details?.incipit ?? null,
    url: details?.original_url ?? '',
    imageUrl: details?.thumbnail ?? null,
    sourceDomain: details?.publisher ?? item.publisher ?? null,
    publishedAt: new Date(item.published_at),
  };
}

// Nunca lança — toda falha (rede, status, parsing, artigo malformado) vira
// array vazio/artigo descartado, deixando feed.service.ts servir o cache
// existente. GET /news só devolve uuid/title/published_at/publisher — o
// resto (imagem, descrição, link do artigo original) vem de uma chamada
// separada a GET /details por artigo; se o /details de UM artigo falhar,
// só aquele artigo é descartado, não a categoria inteira.
export async function fetchNewsArticles(category: NewsCategory): Promise<NewsArticle[]> {
  const listParams = buildListParams(category);
  listParams.set('offset', '0');

  const list = await fetchJson<NewsListResponse>('/news', listParams);
  const items = (list?.data ?? []).slice(0, ARTICLES_PER_REFRESH);
  if (items.length === 0) {
    return [];
  }

  // Sequencial, não Promise.all — ver DETAILS_REQUEST_INTERVAL_MS acima.
  const withDetails: NewsArticle[] = [];
  for (const [index, item] of items.entries()) {
    if (index > 0) {
      await sleep(DETAILS_REQUEST_INTERVAL_MS);
    }
    const detailsResponse = await fetchJson<NewsDetailsResponse>(
      '/details',
      new URLSearchParams({ uuid: item.uuid }),
    );
    withDetails.push(toNewsArticle(item, detailsResponse?.data ?? null));
  }

  // Sem original_url utilizável, o card não teria pra onde levar o
  // player em "Ler matéria completa" — descarta em vez de mostrar link
  // quebrado (details ausente por falha isolada de rede, não por regra
  // de negócio).
  return withDetails.filter((article) => article.url.length > 0);
}
