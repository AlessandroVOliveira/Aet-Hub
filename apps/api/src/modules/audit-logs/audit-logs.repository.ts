import type { Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

export interface AuditLogFilters {
  action?: string;
  entityType?: string;
}

const auditLogInclude = {
  actor: {
    select: {
      id: true,
      username: true,
      profile: { select: { displayName: true } },
    },
  },
} satisfies Prisma.AuditLogInclude;

// Sem paginação real ainda (mesmo padrão de listReports/listAllUsersForAdmin)
// — só um teto defensivo, o volume de ações admin é baixo.
export function listAuditLogs(tx: Prisma.TransactionClient, filters: AuditLogFilters) {
  return tx.auditLog.findMany({
    where: {
      action: filters.action || undefined,
      entityType: filters.entityType || undefined,
    },
    include: auditLogInclude,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}
