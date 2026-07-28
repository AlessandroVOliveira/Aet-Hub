import type { CosmeticRarity, Prisma } from '@prisma/client';

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
  // Armário cosmético (fatia 2) — snapshot do loadout do remetente no
  // momento do envio (não retroage, mesma semântica de senderDisplayName).
  senderFrameClassName: string | null;
  senderTitleName: string | null;
  senderTitleRarity: CosmeticRarity | null;
  // Armário cosmético (fatia 3) — só fonte, sem mascote (ver
  // matches.repository.ts/ranking.repository.ts pro mesmo racional).
  senderFontClassName: string | null;
  content: string;
}

export function createMessage(tx: Prisma.TransactionClient, data: CreateChatMessageData) {
  return tx.chatMessage.create({ data });
}

export function findMessageById(tx: Prisma.TransactionClient, id: string) {
  return tx.chatMessage.findUnique({ where: { id } });
}

// Único delete deste model — sem self-delete (mensagem de chat é imutável
// pro autor); só admin remove, a partir da fila de denúncias (RF-25).
export function deleteMessageByIdAsAdmin(tx: Prisma.TransactionClient, id: string) {
  return tx.chatMessage.deleteMany({ where: { id } });
}
