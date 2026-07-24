import type { Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

export interface ConversationSummary {
  otherUserId: string;
  otherDisplayName: string;
  lastMessageContent: string;
  lastMessageSenderId: string;
  lastMessageAt: Date;
}

// Shape bruto (snake_case) devolvido pela query abaixo.
interface ConversationRow {
  other_user_id: string;
  other_display_name: string;
  last_message_content: string;
  last_message_sender_id: string;
  last_message_at: Date;
}

// Sem tabela Conversation própria: uma "conversa" é a última mensagem por
// par de usuários, derivada aqui via DISTINCT ON. A query de propósito NÃO
// tem WHERE nenhum filtrando por userId — quem filtra é a RLS de
// direct_messages (via withRls, só linhas onde o usuário é remetente ou
// destinatário chegam ao Postgres). Sem passar por withRls, esta função
// devolveria a "conversa" mais recente de QUALQUER usuário.
//
// Três níveis de subquery, não dois: o Postgres exige que a expressão do
// DISTINCT ON seja IDÊNTICA à primeira expressão do ORDER BY do mesmo
// SELECT — mas cada `${userId}` de um template tagged do Prisma vira um
// placeholder NOVO (`$1`, `$2`, ...), então repetir a mesma CASE inline em
// DISTINCT ON e ORDER BY gera dois placeholders diferentes com o mesmo
// valor, e o Postgres rejeita com 42P10 por não achar textualmente iguais.
// O nível mais interno calcula `other_user_id` uma única vez; o nível do
// meio só referencia essa coluna já materializada (sem CASE) em DISTINCT
// ON/ORDER BY, o que resolve o mismatch.
export async function listConversations(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<ConversationSummary[]> {
  const rows = await tx.$queryRaw<ConversationRow[]>`
    SELECT other_user_id, other_display_name, last_message_content,
           last_message_sender_id, last_message_at
    FROM (
      SELECT DISTINCT ON (other_user_id)
        other_user_id, other_display_name, last_message_content,
        last_message_sender_id, last_message_at
      FROM (
        SELECT
          CASE WHEN sender_id = ${userId} THEN recipient_id ELSE sender_id END AS other_user_id,
          CASE WHEN sender_id = ${userId} THEN recipient_display_name ELSE sender_display_name END AS other_display_name,
          content AS last_message_content,
          sender_id AS last_message_sender_id,
          created_at AS last_message_at
        FROM direct_messages
      ) per_message
      ORDER BY other_user_id, last_message_at DESC
    ) conversations
    ORDER BY last_message_at DESC
  `;

  return rows.map((row) => ({
    otherUserId: row.other_user_id,
    otherDisplayName: row.other_display_name,
    lastMessageContent: row.last_message_content,
    lastMessageSenderId: row.last_message_sender_id,
    lastMessageAt: row.last_message_at,
  }));
}

// app_dm_recipient_display_name() (SECURITY DEFINER, migration
// direct_messages_rls_policies) é a fronteira de exposição: devolve só o
// display_name de uma conta ativa, ou null se o destinatário não existir/
// estiver inativo/deletado — sem ela, a RLS de users/profiles (só "colegas
// de torneio") esconderia o destinatário do remetente na maioria dos casos.
export async function findRecipientDisplayName(
  tx: Prisma.TransactionClient,
  recipientId: string,
): Promise<string | null> {
  const [row] = await tx.$queryRaw<
    { display_name: string | null }[]
  >`SELECT app_dm_recipient_display_name(${recipientId}) AS display_name`;

  return row?.display_name ?? null;
}

// Mesmo teto defensivo/sem paginação real do chat geral
// (chat.repository.ts#listRecentMessages) — take: 100.
export function listMessagesWithUser(
  tx: Prisma.TransactionClient,
  userId: string,
  otherUserId: string,
) {
  return tx.directMessage.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export interface CreateDirectMessageData {
  senderId: string;
  recipientId: string;
  senderDisplayName: string;
  recipientDisplayName: string;
  content: string;
}

export function createDirectMessage(tx: Prisma.TransactionClient, data: CreateDirectMessageData) {
  return tx.directMessage.create({ data });
}

// RLS de direct_messages (sender OU recipient = sessão) escopa isto
// naturalmente: um reporter que não participa da conversa recebe null, sem
// vazar que a mensagem existe.
export function findMessageById(tx: Prisma.TransactionClient, id: string) {
  return tx.directMessage.findUnique({ where: { id } });
}
