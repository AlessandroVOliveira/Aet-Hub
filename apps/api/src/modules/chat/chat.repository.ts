import type { Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

// Sem paginação real ainda (mesmo padrão de
// users.repository.ts#listPointsTransactions) — só um teto defensivo.
export function listRecentMessages(tx: Prisma.TransactionClient) {
  return tx.chatMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export interface CreateChatMessageData {
  userId: string;
  senderDisplayName: string;
  content: string;
}

export function createMessage(tx: Prisma.TransactionClient, data: CreateChatMessageData) {
  return tx.chatMessage.create({ data });
}
