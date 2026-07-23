import { withRls } from '../../config/rls.js';
import { getSocketServer } from '../../config/socket.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import { findProfileByUserId } from '../users/users.repository.js';
import * as directMessagesRepository from './direct-messages.repository.js';
import type { SendDirectMessageInput } from './direct-messages.schemas.js';

export async function listConversations(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, (tx) =>
    directMessagesRepository.listConversations(tx, actor.id),
  );
}

export async function listMessagesWith(actor: AccessTokenPayload, otherUserId: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const messages = await directMessagesRepository.listMessagesWithUser(
      tx,
      actor.id,
      otherUserId,
    );
    // Mesmo motivo do chat geral: `listMessagesWithUser` busca desc (mais
    // recente primeiro) por causa do teto defensivo `take: 100` — reverte
    // aqui para ordem cronológica. Não valida se `otherUserId` existe: uma
    // conversa vazia (usuário inexistente ou sem mensagens) não vaza nada.
    return messages.reverse();
  });
}

export async function sendMessage(
  actor: AccessTokenPayload,
  recipientId: string,
  input: SendDirectMessageInput,
) {
  if (recipientId === actor.id) {
    throw new AppError('Você não pode enviar mensagem para si mesmo', 400);
  }

  const message = await withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const recipientDisplayName = await directMessagesRepository.findRecipientDisplayName(
      tx,
      recipientId,
    );
    if (!recipientDisplayName) {
      throw new AppError('Destinatário não encontrado', 404);
    }

    const senderProfile = await findProfileByUserId(tx, actor.id);
    if (!senderProfile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    return directMessagesRepository.createDirectMessage(tx, {
      senderId: actor.id,
      recipientId,
      senderDisplayName: senderProfile.displayName,
      recipientDisplayName,
      content: input.content,
    });
  });

  // Broadcast DEPOIS do commit do withRls (fora do callback) — mesmo
  // motivo do chat geral: emitir antes poderia vazar uma mensagem que
  // acabou sofrendo rollback. Diferente do chat geral (emite pro
  // namespace inteiro), aqui a entrega é direcionada só às salas dos dois
  // participantes (`user:{id}`, ver config/socket.ts) — best-effort, se
  // não houver servidor de socket (ex. script fora do processo HTTP), só
  // pula.
  getSocketServer()
    ?.of('/chat')
    .to(`user:${message.senderId}`)
    .to(`user:${message.recipientId}`)
    .emit('chat:dm', { message });

  return message;
}
