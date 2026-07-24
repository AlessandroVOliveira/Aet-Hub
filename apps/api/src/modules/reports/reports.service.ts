import { Prisma, type ReportedContentType, type ReportStatus } from '@prisma/client';
import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import { findProfileByUserId } from '../users/users.repository.js';
import * as postsRepository from '../communities/posts.repository.js';
import * as chatRepository from '../chat/chat.repository.js';
import * as directMessagesRepository from '../chat/direct-messages.repository.js';
import * as feedRepository from '../feed/feed.repository.js';
import * as reportsRepository from './reports.repository.js';
import type { CreateReportInput } from './reports.schemas.js';

interface ReportedContent {
  authorId: string;
  authorDisplayName: string;
  content: string;
}

// Despacha pro repository do módulo dono de cada tipo de conteúdo, sob a
// própria sessão RLS do denunciante (withRls já aberta pelo caller) — não
// uma função SECURITY DEFINER: é um INSERT auto-referente (o denunciante
// denuncia como ele mesmo), sem fronteira de privilégio cross-user pra
// atravessar. Bônus: RLS de direct_messages já esconde DMs das quais o
// denunciante não participa, então o lookup devolve null sozinho (vira 404).
async function lookupReportedContent(
  tx: Prisma.TransactionClient,
  contentType: ReportedContentType,
  contentId: string,
): Promise<ReportedContent | null> {
  switch (contentType) {
    case 'POST': {
      const post = await postsRepository.findPostById(tx, contentId);
      if (!post) return null;
      return { authorId: post.userId, authorDisplayName: post.authorDisplayName, content: post.content };
    }
    case 'COMMENT': {
      const comment = await postsRepository.findCommentById(tx, contentId);
      if (!comment) return null;
      return {
        authorId: comment.userId,
        authorDisplayName: comment.authorDisplayName,
        content: comment.content,
      };
    }
    case 'CHAT_MESSAGE': {
      const message = await chatRepository.findMessageById(tx, contentId);
      if (!message) return null;
      return {
        authorId: message.userId,
        authorDisplayName: message.senderDisplayName,
        content: message.content,
      };
    }
    case 'DIRECT_MESSAGE': {
      const message = await directMessagesRepository.findMessageById(tx, contentId);
      if (!message) return null;
      // Autor é sempre quem enviou, independente de qual dos dois
      // participantes está denunciando.
      return {
        authorId: message.senderId,
        authorDisplayName: message.senderDisplayName,
        content: message.content,
      };
    }
    case 'NEWS_COMMENT': {
      const comment = await feedRepository.findNewsCommentById(tx, contentId);
      if (!comment) return null;
      return {
        authorId: comment.userId,
        authorDisplayName: comment.authorDisplayName,
        content: comment.content,
      };
    }
  }
}

export async function createReport(actor: AccessTokenPayload, input: CreateReportInput) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const reported = await lookupReportedContent(tx, input.contentType, input.contentId);
    if (!reported) {
      throw new AppError('Conteúdo denunciado não encontrado', 404);
    }
    if (reported.authorId === actor.id) {
      throw new AppError('Você não pode denunciar seu próprio conteúdo', 400);
    }

    const profile = await findProfileByUserId(tx, actor.id);
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    try {
      return await reportsRepository.createReport(tx, {
        reporterId: actor.id,
        reporterDisplayName: profile.displayName,
        contentType: input.contentType,
        contentId: input.contentId,
        reason: input.reason,
        contentSnapshot: reported.content,
        contentAuthorId: reported.authorId,
        contentAuthorDisplayName: reported.authorDisplayName,
      });
    } catch (error) {
      // P2002 = unique(reporterId, contentType, contentId) já existe.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Você já denunciou este conteúdo', 409);
      }
      throw error;
    }
  });
}

export async function listReports(actor: AccessTokenPayload, status?: ReportStatus) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    reportsRepository.listReports(tx, status),
  );
}

export async function dismissReport(actor: AccessTokenPayload, reportId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const report = await reportsRepository.findReportById(tx, reportId);
    if (!report) {
      throw new AppError('Denúncia não encontrada', 404);
    }
    if (report.status !== 'PENDING') {
      throw new AppError('Esta denúncia já foi revisada', 409);
    }

    return reportsRepository.updateReportStatus(tx, reportId, {
      status: 'DISMISSED',
      reviewedAt: new Date(),
      reviewedByUserId: actor.id,
    });
  });
}
