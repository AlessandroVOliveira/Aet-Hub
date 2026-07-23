import { Prisma } from '@prisma/client';
import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import { findProfileByUserId } from '../users/users.repository.js';
import * as notificationsRepository from '../notifications/notifications.repository.js';
import { emitNewNotification } from '../notifications/notifications.emitter.js';
import * as communitiesRepository from './communities.repository.js';
import * as postsRepository from './posts.repository.js';
import type { CreateCommentInput, CreatePostInput } from './posts.schemas.js';

export interface PostView {
  id: string;
  communityId: string;
  userId: string;
  authorDisplayName: string;
  content: string;
  createdAt: Date;
  commentCount: number;
  likeCount: number;
  likedByMe: boolean;
}

interface PostWithCounts {
  id: string;
  communityId: string;
  userId: string;
  authorDisplayName: string;
  content: string;
  createdAt: Date;
  _count: { comments: number; likes: number };
}

function toPostView(post: PostWithCounts, likedByMe: boolean): PostView {
  return {
    id: post.id,
    communityId: post.communityId,
    userId: post.userId,
    authorDisplayName: post.authorDisplayName,
    content: post.content,
    createdAt: post.createdAt,
    commentCount: post._count.comments,
    likeCount: post._count.likes,
    likedByMe,
  };
}

async function assertActiveCommunity(tx: Prisma.TransactionClient, communityId: string) {
  const community = await communitiesRepository.findCommunityById(tx, communityId);
  if (!community || !community.isActive) {
    throw new AppError('Comunidade não encontrada', 404);
  }
}

export async function listPosts(actor: AccessTokenPayload, communityId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    await assertActiveCommunity(tx, communityId);

    const posts = await postsRepository.listPostsByCommunity(tx, communityId);
    const likedRows = await postsRepository.findLikedPostIds(
      tx,
      actor.id,
      posts.map((post) => post.id),
    );
    const likedIds = new Set(likedRows.map((row) => row.postId));

    return posts.map((post) => toPostView(post, likedIds.has(post.id)));
  });
}

export async function createPost(
  actor: AccessTokenPayload,
  communityId: string,
  input: CreatePostInput,
) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    await assertActiveCommunity(tx, communityId);

    const profile = await findProfileByUserId(tx, actor.id);
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const post = await postsRepository.createPost(tx, {
      communityId,
      userId: actor.id,
      authorDisplayName: profile.displayName,
      content: input.content,
    });

    return toPostView(post, false);
  });
}

export async function getPostDetail(actor: AccessTokenPayload, postId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const post = await postsRepository.findPostById(tx, postId);
    if (!post) {
      throw new AppError('Post não encontrado', 404);
    }

    const likedRows = await postsRepository.findLikedPostIds(tx, actor.id, [post.id]);
    const comments = await postsRepository.listCommentsByPost(tx, postId);

    return {
      post: toPostView(post, likedRows.length > 0),
      // listCommentsByPost busca desc (teto defensivo take:100) — reverte
      // aqui pra ordem cronológica, mesmo padrão de
      // direct-messages.service.ts#listMessagesWith.
      comments: comments.reverse(),
    };
  });
}

export async function deletePost(actor: AccessTokenPayload, postId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const { count } = await postsRepository.deletePostByIdForUser(tx, postId, actor.id);
    if (count === 0) {
      throw new AppError('Post não encontrado', 404);
    }
  });
}

// Template: direct-messages.service.ts#sendMessage — snapshot de autor +
// notificação dentro do withRls, emit pós-commit fora dele.
export async function createComment(
  actor: AccessTokenPayload,
  postId: string,
  input: CreateCommentInput,
) {
  const { comment, notification } = await withRls(
    { userId: actor.id, role: actor.role },
    async (tx) => {
      const post = await postsRepository.findPostById(tx, postId);
      if (!post) {
        throw new AppError('Post não encontrado', 404);
      }

      const profile = await findProfileByUserId(tx, actor.id);
      if (!profile) {
        throw new AppError('Perfil não encontrado', 404);
      }

      const createdComment = await postsRepository.createComment(tx, {
        postId,
        userId: actor.id,
        authorDisplayName: profile.displayName,
        content: input.content,
      });

      // Sem notificação quando o autor comenta no próprio post — a função
      // SQL também recusaria (p.user_id <> c.user_id), esta checagem só
      // evita a chamada desnecessária.
      if (post.userId === actor.id) {
        return { comment: createdComment, notification: null };
      }

      const createdNotification = await notificationsRepository.createNotification(tx, {
        userId: post.userId,
        type: 'POST_COMMENT',
        title: 'Novo comentário no seu post',
        body: `${createdComment.authorDisplayName} comentou no seu post`,
        linkPath: `/comunidade/${post.communityId}/posts/${post.id}`,
        refId: createdComment.id,
      });

      return { comment: createdComment, notification: createdNotification };
    },
  );

  // Pós-commit (mesmo motivo de direct-messages.service.ts/store.service.ts)
  if (notification) {
    emitNewNotification(notification);
  }

  return comment;
}

export async function deleteComment(actor: AccessTokenPayload, commentId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const { count } = await postsRepository.deleteCommentByIdForUser(tx, commentId, actor.id);
    if (count === 0) {
      throw new AppError('Comentário não encontrado', 404);
    }
  });
}

export async function likePost(actor: AccessTokenPayload, postId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const post = await postsRepository.findPostById(tx, postId);
    if (!post) {
      throw new AppError('Post não encontrado', 404);
    }

    try {
      await postsRepository.createLike(tx, { postId, userId: actor.id });
    } catch (error) {
      // P2002 = unique(postId, userId) já existe — curtir de novo é
      // idempotente, não é erro.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }
    }
  });
}

export async function unlikePost(actor: AccessTokenPayload, postId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    await postsRepository.deleteLike(tx, postId, actor.id);
  });
}
