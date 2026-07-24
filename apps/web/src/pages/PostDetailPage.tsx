import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePostDetail } from '@/hooks/usePostDetail';
import { useDeletePost, useLikePost, useUnlikePost } from '@/hooks/usePostMutations';
import { useCreateComment, useDeleteComment } from '@/hooks/useCommentMutations';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { Banner } from '@/components/ui/Banner';
import { ReportForm } from '@/components/reports/ReportForm';
import { formatDate } from '@/utils/format';
import type { PostComment } from '@/types/community';

const MAX_COMMENT_LENGTH = 500;

export function PostDetailPage() {
  const { id: communityId, postId } = useParams<{ id: string; postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const detailQuery = usePostDetail(postId);

  const deletePost = useDeletePost(communityId ?? '');
  const likePost = useLikePost(communityId ?? '', postId ?? '');
  const unlikePost = useUnlikePost(communityId ?? '', postId ?? '');

  if (detailQuery.isLoading) {
    return <p className="p-4 md:p-8 text-sm text-silver-muted">Carregando...</p>;
  }

  if (detailQuery.isError) {
    return (
      <div className="p-4 md:p-8">
        <Banner variant="error">
          {detailQuery.error instanceof ApiError ? detailQuery.error.message : 'Erro inesperado'}
        </Banner>
      </div>
    );
  }

  if (!detailQuery.data || !communityId || !postId) return null;

  const { post, comments } = detailQuery.data;
  const isOwner = post.userId === user?.id;
  const toggleLike = post.likedByMe ? unlikePost : likePost;

  function handleDeletePost() {
    if (!window.confirm('Excluir este post? Comentários e curtidas serão removidos juntos.')) {
      return;
    }
    deletePost.mutate(post.id, {
      onSuccess: () => navigate(`/comunidade/${communityId}`),
    });
  }

  return (
    <div>
      <PageHeader eyebrow="POST" title="COMENTÁRIOS" />

      <div className="p-4 md:p-8 max-w-2xl space-y-4">
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

          <div className="mt-3 flex items-center gap-4 font-mono text-[10px] text-silver-muted uppercase flex-wrap">
            <button
              type="button"
              disabled={toggleLike.isPending}
              onClick={() => toggleLike.mutate()}
              className={`hover:text-ember transition-colors ${post.likedByMe ? 'text-ember' : ''}`}
            >
              {post.likedByMe ? 'Descurtir' : 'Curtir'} ({post.likeCount})
            </button>
            {isOwner ? (
              <button
                type="button"
                disabled={deletePost.isPending}
                onClick={handleDeletePost}
                className="hover:text-ember transition-colors ml-auto"
              >
                Excluir post
              </button>
            ) : (
              <ReportForm contentType="POST" contentId={post.id} triggerClassName="ml-auto" />
            )}
          </div>
        </article>

        <div className="space-y-3">
          {comments.length === 0 && (
            <p className="text-sm text-silver-muted">Nenhum comentário ainda. Comente primeiro!</p>
          )}
          {comments.map((comment) => (
            <CommentRow key={comment.id} communityId={communityId} postId={postId} comment={comment} />
          ))}
        </div>

        <CommentComposer communityId={communityId} postId={postId} />
      </div>
    </div>
  );
}

function CommentRow({
  communityId,
  postId,
  comment,
}: {
  communityId: string;
  postId: string;
  comment: PostComment;
}) {
  const { user } = useAuth();
  const deleteComment = useDeleteComment(communityId, postId);
  const isOwner = comment.userId === user?.id;

  function handleDelete() {
    if (!window.confirm('Excluir este comentário?')) return;
    deleteComment.mutate(comment.id);
  }

  return (
    <article className="bg-navy-light ring-1 ring-silver/10 p-3">
      <header className="flex items-center justify-between mb-1 flex-wrap gap-1">
        <span className="font-mono text-xs">
          <span className="text-silver">@{comment.authorDisplayName}</span>
          <span className="text-silver-muted ml-2">{formatDate(comment.createdAt)}</span>
        </span>
        {isOwner ? (
          <button
            type="button"
            disabled={deleteComment.isPending}
            onClick={handleDelete}
            className="font-mono text-[10px] uppercase text-silver-muted hover:text-ember transition-colors"
          >
            Excluir
          </button>
        ) : (
          <ReportForm contentType="COMMENT" contentId={comment.id} />
        )}
      </header>
      <p className="text-sm text-silver text-pretty whitespace-pre-wrap">{comment.content}</p>
      {deleteComment.isError && (
        <Banner variant="error">
          {deleteComment.error instanceof ApiError ? deleteComment.error.message : 'Erro inesperado'}
        </Banner>
      )}
    </article>
  );
}

function CommentComposer({ communityId, postId }: { communityId: string; postId: string }) {
  const [content, setContent] = useState('');
  const createComment = useCreateComment(communityId, postId);

  function handleSubmit() {
    createComment.mutate(content.trim(), {
      onSuccess: () => setContent(''),
    });
  }

  return (
    <div className="bg-navy-light ring-1 ring-silver/10 p-4">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={3}
        maxLength={MAX_COMMENT_LENGTH}
        placeholder="Escreva um comentário..."
        className="w-full bg-navy-dark p-3 text-sm font-mono outline-none focus:ring-1 focus:ring-ember resize-none"
      />
      {createComment.isError && (
        <Banner variant="error">
          {createComment.error instanceof ApiError ? createComment.error.message : 'Erro inesperado'}
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
          className="px-4 py-2 bg-ember hover:bg-ember-glow disabled:opacity-60 disabled:cursor-not-allowed text-white font-display italic tracking-widest uppercase text-xs transition-colors"
        >
          {createComment.isPending ? 'Enviando...' : 'Comentar'}
        </button>
      </div>
    </div>
  );
}
