import type { Prisma } from '@prisma/client';

export interface AuditLogData {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

// Sempre chamado dentro do withRls da própria ação de moderação, nunca
// depois do commit — se a transação sofrer rollback, o log não deve
// existir (oposto do padrão "emit pós-commit" de socket, que é sobre
// efeitos observáveis fora da transação).
export function recordAuditLog(tx: Prisma.TransactionClient, data: AuditLogData) {
  return tx.auditLog.create({ data });
}
