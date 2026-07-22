import { withRls } from '../../config/rls.js';
import { getSocketServer } from '../../config/socket.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import { findProfileByUserId } from '../users/users.repository.js';
import * as chatRepository from './chat.repository.js';
import type { SendChatMessageInput } from './chat.schemas.js';

export async function listMessages(actor: AccessTokenPayload) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const messages = await chatRepository.listRecentMessages(tx);
    // `listRecentMessages` busca desc (mais recente primeiro) por causa do
    // teto defensivo `take: 100` — reverte aqui para entregar em ordem
    // cronológica (mais antiga primeiro), como a tela de chat espera.
    return messages.reverse();
  });
}

export async function sendMessage(actor: AccessTokenPayload, input: SendChatMessageInput) {
  const message = await withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const profile = await findProfileByUserId(tx, actor.id);
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    return chatRepository.createMessage(tx, {
      userId: actor.id,
      senderDisplayName: profile.displayName,
      content: input.content,
    });
  });

  // Broadcast DEPOIS do commit do withRls (fora do callback) — emitir
  // antes poderia vazar uma mensagem que acabou sofrendo rollback. Carrega
  // o payload inteiro (diferente do fire-and-refetch do bracket): refetch
  // por mensagem de chat não escala com o volume de eventos. Best-effort —
  // se não houver servidor de socket (ex. script fora do processo HTTP),
  // só pula.
  getSocketServer()?.of('/chat').emit('chat:message', { message });

  return message;
}
