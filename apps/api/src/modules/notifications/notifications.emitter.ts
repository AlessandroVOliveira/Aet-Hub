import type { Notification } from '@prisma/client';
import { getSocketServer } from '../../config/socket.js';

// SEMPRE chamado depois do commit da transação que criou a notificação
// (pós-withRls) — nunca de dentro do callback, senão um rollback
// entregaria uma notificação que nunca existiu de verdade no banco. Reusa
// o namespace /chat e a sala `user:{id}` que config/socket.ts já cria no
// connection (mesma infraestrutura do chat:dm). Best-effort: se não houver
// servidor de socket (ex. script rodando fora do processo HTTP),
// getSocketServer() retorna undefined e a chamada só é pulada.
export function emitNewNotification(notification: Notification): void {
  getSocketServer()
    ?.of('/chat')
    .to(`user:${notification.userId}`)
    .emit('notification:new', { notification });
}

export function emitNewNotifications(notifications: Notification[]): void {
  for (const notification of notifications) {
    emitNewNotification(notification);
  }
}
