// Ações/entidades conhecidas hoje (RF-19/RF-25) — usadas só pra popular os
// filtros e os rótulos amigáveis; o campo real na API é string livre
// (audit_logs.action/entity_type não são enum no Prisma), então qualquer
// ação nova em fatia futura aparece sem quebrar a tela, só sem rótulo
// traduzido (ver actionLabel/entityTypeLabel em utils/format.ts).
export type AuditLogAction =
  | 'MATCH_RESULT_CORRECTED'
  | 'USER_BANNED'
  | 'USER_UNBANNED'
  | 'USER_MUTED'
  | 'USER_UNMUTED'
  | 'USER_DELETED'
  | 'USER_RESTORED'
  | 'USER_EDITED_BY_ADMIN'
  | 'CONTENT_REMOVED';

export type AuditLogEntityType =
  | 'MATCH'
  | 'USER'
  | 'POST'
  | 'COMMENT'
  | 'CHAT_MESSAGE'
  | 'DIRECT_MESSAGE'
  | 'NEWS_COMMENT';

export interface AuditLogActor {
  id: string;
  username: string;
  profile: { displayName: string } | null;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actor: AuditLogActor;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ListAuditLogsResponse {
  auditLogs: AuditLog[];
}

export interface AuditLogFilters {
  action?: string;
  entityType?: string;
}
