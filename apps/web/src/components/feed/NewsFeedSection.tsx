import { useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNews } from '@/hooks/useNews';
import { useNewsComments } from '@/hooks/useNewsComments';
import { useCreateNewsComment, useDeleteNewsComment } from '@/hooks/useNewsCommentMutations';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';
import { formatDate } from '@/utils/format';
import type { NewsCategory, NewsComment, NewsItem } from '@/types/feed';

const MAX_COMMENT_LENGTH = 500;

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  GENERAL: 'Novidades',
  ESPORTS: 'E-sports',
};

export function NewsFeedSection() {
  const [category, setCategory] = useState<NewsCategory>('GENERAL');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const newsQuery = useNews(category);

  function toggleExpanded(newsItemId: string) {
    setExpanded((prev) => ({ ...prev, [newsItemId]: !prev[newsItemId] }));
  }

  // Achata as páginas do useInfiniteQuery numa lista só pra renderizar —
  // "expanded" continua chaveado por newsItemId, funciona igual através
  // de páginas.
  const newsItems = newsQuery.data?.pages.flatMap((page) => page.newsItems) ?? [];

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-display text-2xl tracking-tight uppercase italic">Feed principal</h3>
        <div className="flex gap-2">
          {(Object.keys(CATEGORY_LABELS) as NewsCategory[]).map((value) => (
            <CategoryToggleButton
              key={value}
              active={category === value}
              onClick={() => setCategory(value)}
            >
              {CATEGORY_LABELS[value]}
            </CategoryToggleButton>
          ))}
        </div>
      </div>

      {newsQuery.isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

      {newsQuery.isError && (
        <Banner variant="error">
          {newsQuery.error instanceof ApiError ? newsQuery.error.message : 'Erro inesperado'}
        </Banner>
      )}

      {!newsQuery.isLoading && !newsQuery.isError && newsItems.length === 0 && (
        <p className="text-sm text-silver-muted">Nenhuma notícia encontrada nesta categoria.</p>
      )}

      {newsItems.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {newsItems.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                category={category}
                isExpanded={!!expanded[item.id]}
                onToggleExpand={() => toggleExpanded(item.id)}
              />
            ))}
          </div>

          {newsQuery.hasNextPage && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                disabled={newsQuery.isFetchingNextPage}
                onClick={() => newsQuery.fetchNextPage()}
                className="px-6 py-2 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 disabled:opacity-60 disabled:cursor-not-allowed font-mono text-[10px] uppercase tracking-widest transition"
              >
                {newsQuery.isFetchingNextPage ? 'Carregando...' : 'Ver notícias mais antigas'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function CategoryToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition ${
        active ? 'bg-ember text-white' : 'bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40'
      }`}
    >
      {children}
    </button>
  );
}

function NewsCard({
  item,
  category,
  isExpanded,
  onToggleExpand,
}: {
  item: NewsItem;
  category: NewsCategory;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <article className="bg-navy-light ring-1 ring-silver/10 overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-navy-dark overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-ember/40 via-navy-dark to-navy-light" />
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-display text-6xl italic tracking-tighter text-silver/20">
                {item.title.slice(0, 4).toUpperCase()}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <p className="font-mono text-[10px] text-silver-muted mb-1">
          {item.sourceDomain ?? 'Fonte externa'} · {formatDate(item.publishedAt)}
        </p>
        <h4 className="font-display text-lg uppercase italic tracking-tight mb-2">{item.title}</h4>
        {item.description && (
          <p className="text-sm text-silver-muted line-clamp-3 flex-1">{item.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase text-silver-muted">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="hover:text-ember transition-colors"
          >
            Ler matéria completa
          </a>
          <button
            type="button"
            onClick={onToggleExpand}
            className="hover:text-ember transition-colors"
          >
            Comentários ({item.commentCount})
          </button>
        </div>

        {isExpanded && <NewsCommentThread category={category} newsItemId={item.id} />}
      </div>
    </article>
  );
}

function NewsCommentThread({
  category,
  newsItemId,
}: {
  category: NewsCategory;
  newsItemId: string;
}) {
  const commentsQuery = useNewsComments(newsItemId, true);

  return (
    <div className="mt-3 pt-3 border-t border-silver/10 space-y-3">
      {commentsQuery.isLoading && <p className="text-xs text-silver-muted">Carregando...</p>}

      {commentsQuery.isError && (
        <Banner variant="error">
          {commentsQuery.error instanceof ApiError
            ? commentsQuery.error.message
            : 'Erro inesperado'}
        </Banner>
      )}

      {!commentsQuery.isLoading &&
        !commentsQuery.isError &&
        commentsQuery.data?.comments.length === 0 && (
          <p className="text-xs text-silver-muted">Nenhum comentário ainda. Comente primeiro!</p>
        )}

      {commentsQuery.data?.comments.map((comment) => (
        <NewsCommentRow
          key={comment.id}
          category={category}
          newsItemId={newsItemId}
          comment={comment}
        />
      ))}

      <NewsCommentComposer category={category} newsItemId={newsItemId} />
    </div>
  );
}

function NewsCommentRow({
  category,
  newsItemId,
  comment,
}: {
  category: NewsCategory;
  newsItemId: string;
  comment: NewsComment;
}) {
  const { user } = useAuth();
  const deleteComment = useDeleteNewsComment(category, newsItemId);
  const isOwner = comment.userId === user?.id;

  function handleDelete() {
    if (!window.confirm('Excluir este comentário?')) return;
    deleteComment.mutate(comment.id);
  }

  return (
    <article className="bg-navy-dark p-3">
      <header className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px]">
          <span className="text-silver">@{comment.authorDisplayName}</span>
          <span className="text-silver-muted ml-2">{formatDate(comment.createdAt)}</span>
        </span>
        {isOwner && (
          <button
            type="button"
            disabled={deleteComment.isPending}
            onClick={handleDelete}
            className="font-mono text-[10px] uppercase text-silver-muted hover:text-ember transition-colors"
          >
            Excluir
          </button>
        )}
      </header>
      <p className="text-sm text-silver text-pretty whitespace-pre-wrap">{comment.content}</p>
      {deleteComment.isError && (
        <Banner variant="error">
          {deleteComment.error instanceof ApiError
            ? deleteComment.error.message
            : 'Erro inesperado'}
        </Banner>
      )}
    </article>
  );
}

function NewsCommentComposer({
  category,
  newsItemId,
}: {
  category: NewsCategory;
  newsItemId: string;
}) {
  const [content, setContent] = useState('');
  const createComment = useCreateNewsComment(category, newsItemId);

  function handleSubmit() {
    createComment.mutate(content.trim(), {
      onSuccess: () => setContent(''),
    });
  }

  return (
    <div className="bg-navy-dark p-3">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={2}
        maxLength={MAX_COMMENT_LENGTH}
        placeholder="Escreva um comentário..."
        className="w-full bg-navy-light p-2 text-xs font-mono outline-none focus:ring-1 focus:ring-ember resize-none"
      />
      {createComment.isError && (
        <Banner variant="error">
          {createComment.error instanceof ApiError
            ? createComment.error.message
            : 'Erro inesperado'}
        </Banner>
      )}
      <div className="mt-2 flex justify-between items-center">
        <span className="font-mono text-[10px] text-silver-muted">
          {content.length}/{MAX_COMMENT_LENGTH}
        </span>
        <button
          type="button"
          disabled={!content.trim() || createComment.isPending}
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-ember hover:bg-ember-glow disabled:opacity-60 disabled:cursor-not-allowed text-white font-display italic tracking-widest uppercase text-[10px] transition-colors"
        >
          {createComment.isPending ? 'Enviando...' : 'Comentar'}
        </button>
      </div>
    </div>
  );
}
