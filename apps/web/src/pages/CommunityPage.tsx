import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity } from '@/hooks/useCommunity';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { useCreatePost, useDeletePost, useLikePost, useUnlikePost } from '@/hooks/usePostMutations';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { Banner } from '@/components/ui/Banner';
import { formatDate } from '@/utils/format';
import type { Post } from '@/types/community';

const MAX_POST_LENGTH = 500;

export function CommunityPage() {
  const { id } = useParams<{ id: string }>();
  const communityQuery = useCommunity(id);
  const postsQuery = useCommunityPosts(id);

  if (communityQuery.isLoading || postsQuery.isLoading) {
    return <p className="p-4 md:p-8 text-sm text-silver-muted">Carregando...</p>;
  }

  if (communityQuery.isError) {
    return (
      <div className="p-4 md:p-8">
        <Banner variant="error">
          {communityQuery.error instanceof ApiError
            ? communityQuery.error.message
            : 'Erro inesperado'}
        </Banner>
      </div>
    );
  }

  const community = communityQuery.data?.community;
  if (!community || !id) return null;

  return (
    <div>
      <PageHeader
        eyebrow={community.game?.name ?? 'GERAL'}
        title={community.name.toUpperCase()}
        description={community.description}
      />

      <div className="p-4 md:p-8 max-w-2xl space-y-4">
        <PostComposer communityId={id} />

        {postsQuery.isError && (
          <Banner variant="error">
            {postsQuery.error instanceof ApiError ? postsQuery.error.message : 'Erro inesperado'}
          </Banner>
        )}

        {postsQuery.data && postsQuery.data.posts.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhum post por aqui ainda. Seja o primeiro!</p>
        )}

        {postsQuery.data?.posts.map((post) => (
          <PostCard key={post.id} communityId={id} post={post} />
        ))}
      </div>
    </div>
  );
}

function PostComposer({ communityId }: { communityId: string }) {
  const [content, setContent] = useState('');
  const createPost = useCreatePost(communityId);

  function handleSubmit() {
    createPost.mutate(content.trim(), {
      onSuccess: () => setContent(''),
    });
  }

  return (
    <div className="bg-navy-light ring-1 ring-silver/10 p-4">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={3}
        maxLength={MAX_POST_LENGTH}
        placeholder="O que rolou no pampa hoje?"
        className="w-full bg-navy-dark p-3 text-sm font-mono outline-none focus:ring-1 focus:ring-ember resize-none"
      />
      {createPost.isError && (
        <Banner variant="error">
          {createPost.error instanceof ApiError ? createPost.error.message : 'Erro inesperado'}
        </Banner>
      )}
      <div className="mt-2 flex justify-between items-center">
        <span className="font-mono text-[10px] text-silver-muted">
          {content.length}/{MAX_POST_LENGTH}
        </span>
        <button
          type="button"
          disabled={!content.trim() || createPost.isPending}
          onClick={handleSubmit}
          className="px-4 py-2 bg-ember hover:bg-ember-glow disabled:opacity-60 disabled:cursor-not-allowed text-white font-display italic tracking-widest uppercase text-xs transition-colors"
        >
          {createPost.isPending ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </div>
  );
}

function PostCard({ communityId, post }: { communityId: string; post: Post }) {
  const { user } = useAuth();
  const deletePost = useDeletePost(communityId);
  const likePost = useLikePost(communityId, post.id);
  const unlikePost = useUnlikePost(communityId, post.id);

  const isOwner = post.userId === user?.id;
  const toggleLike = post.likedByMe ? unlikePost : likePost;

  function handleDelete() {
    if (!window.confirm('Excluir este post? Comentários e curtidas serão removidos juntos.')) {
      return;
    }
    deletePost.mutate(post.id);
  }

  return (
    <article className="bg-navy-light ring-1 ring-silver/10 p-4">
      <header className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs">
          <span className="text-silver">@{post.authorDisplayName}</span>
          <span className="text-silver-muted ml-2">{formatDate(post.createdAt)}</span>
        </span>
      </header>

      <p className="text-sm text-silver text-pretty whitespace-pre-wrap">{post.content}</p>

      {(deletePost.isError || likePost.isError || unlikePost.isError) && (
        <Banner variant="error">
          {[deletePost.error, likePost.error, unlikePost.error].find(
            (error): error is ApiError => error instanceof ApiError,
          )?.message ?? 'Erro inesperado'}
        </Banner>
      )}

      <div className="mt-3 flex items-center gap-4 font-mono text-[10px] text-silver-muted uppercase">
        <button
          type="button"
          disabled={toggleLike.isPending}
          onClick={() => toggleLike.mutate()}
          className={`hover:text-ember transition-colors ${post.likedByMe ? 'text-ember' : ''}`}
        >
          {post.likedByMe ? 'Descurtir' : 'Curtir'} ({post.likeCount})
        </button>
        <Link to={`/comunidade/${communityId}/posts/${post.id}`} className="hover:text-ember">
          Comentar ({post.commentCount})
        </Link>
        {isOwner && (
          <button
            type="button"
            disabled={deletePost.isPending}
            onClick={handleDelete}
            className="hover:text-ember transition-colors ml-auto"
          >
            Excluir
          </button>
        )}
      </div>
    </article>
  );
}
