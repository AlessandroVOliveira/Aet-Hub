import type { Request, Response } from 'express';
import * as postsService from './posts.service.js';
import type { CreateCommentInput, CreatePostInput } from './posts.schemas.js';

export async function listPostsHandler(req: Request, res: Response): Promise<void> {
  const posts = await postsService.listPosts(req.user!, req.params.id as string);
  res.status(200).json({ posts });
}

export async function createPostHandler(req: Request, res: Response): Promise<void> {
  const post = await postsService.createPost(
    req.user!,
    req.params.id as string,
    req.body as CreatePostInput,
  );
  res.status(201).json({ post });
}

export async function getPostDetailHandler(req: Request, res: Response): Promise<void> {
  const detail = await postsService.getPostDetail(req.user!, req.params.postId as string);
  res.status(200).json(detail);
}

export async function deletePostHandler(req: Request, res: Response): Promise<void> {
  await postsService.deletePost(req.user!, req.params.postId as string);
  res.status(204).send();
}

export async function createCommentHandler(req: Request, res: Response): Promise<void> {
  const comment = await postsService.createComment(
    req.user!,
    req.params.postId as string,
    req.body as CreateCommentInput,
  );
  res.status(201).json({ comment });
}

export async function deleteCommentHandler(req: Request, res: Response): Promise<void> {
  await postsService.deleteComment(req.user!, req.params.commentId as string);
  res.status(204).send();
}

export async function likePostHandler(req: Request, res: Response): Promise<void> {
  await postsService.likePost(req.user!, req.params.postId as string);
  res.status(204).send();
}

export async function unlikePostHandler(req: Request, res: Response): Promise<void> {
  await postsService.unlikePost(req.user!, req.params.postId as string);
  res.status(204).send();
}
