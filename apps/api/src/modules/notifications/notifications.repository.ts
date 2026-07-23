import type { Notification, NotificationType, Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

// Shape bruto (snake_case) devolvido pela função SQL app_create_notification.
interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link_path: string;
  ref_id: string;
  read_at: Date | null;
  created_at: Date;
}

function mapRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    linkPath: row.link_path,
    refId: row.ref_id,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkPath: string;
  refId: string;
}

// Único caminho de escrita: a função SECURITY DEFINER app_create_notification
// (migration notifications_rls_policies) valida por tipo a linha "pai" que
// autoriza a operação e faz o INSERT como dona da função — aet_hub_app não
// tem GRANT de INSERT direto na tabela. Cast do enum obrigatório no
// $queryRaw; mapeamento snake_case -> camelCase feito à mão (mapRow).
export async function createNotification(
  tx: Prisma.TransactionClient,
  data: CreateNotificationData,
): Promise<Notification> {
  const [row] = await tx.$queryRaw<NotificationRow[]>`
    SELECT id, user_id, type, title, body, link_path, ref_id, read_at, created_at
    FROM app_create_notification(
      ${data.userId},
      ${data.type}::"NotificationType",
      ${data.title},
      ${data.body},
      ${data.linkPath},
      ${data.refId}
    )
  `;
  return mapRow(row!);
}

export function listNotifications(tx: Prisma.TransactionClient, userId: string) {
  return tx.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

// Prisma count, nunca COUNT(*) cru via $queryRaw — BigInt quebraria o
// JSON.stringify da resposta (ver app_points_leaderboard/CLAUDE.md).
export function countUnread(tx: Prisma.TransactionClient, userId: string) {
  return tx.notification.count({ where: { userId, readAt: null } });
}

export function markAllRead(tx: Prisma.TransactionClient, userId: string) {
  return tx.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
