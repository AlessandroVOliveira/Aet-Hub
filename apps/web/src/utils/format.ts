import type { CheckinMethod } from '@/types/checkin';
import type { MatchResult } from '@/types/profile';
import type { RegistrationStatus } from '@/types/registration';
import type { RedemptionStatus } from '@/types/store';
import type { ReportedContentType, ReportStatus } from '@/types/report';
import type { BracketType, TiebreakerRule, TournamentStatus } from '@/types/tournament';
import type { AuditLogAction, AuditLogEntityType } from '@/types/audit-log';

export function formatCurrencyFromCents(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// Sempre via Intl sobre o Date, nunca fatiando a string ISO — um slice
// ignoraria o timezone e mostraria a hora UTC em vez da hora local.
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export const bracketTypeLabels: Record<BracketType, string> = {
  SINGLE_ELIMINATION: 'Eliminação simples',
  DOUBLE_ELIMINATION: 'Eliminação dupla',
};

export const tiebreakerRuleLabels: Record<TiebreakerRule, string> = {
  HEAD_TO_HEAD: 'Confronto direto',
  WIN_BALANCE: 'Saldo de vitórias',
};

export const tournamentStatusLabels: Record<TournamentStatus, string> = {
  DRAFT: 'Rascunho',
  REGISTRATION_OPEN: 'Inscrições abertas',
  REGISTRATION_CLOSED: 'Inscrições encerradas',
  CHECKIN_OPEN: 'Check-in aberto',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Encerrado',
  CANCELLED: 'Cancelado',
};

export const tournamentStatusTone: Record<TournamentStatus, 'accent' | 'live' | 'muted'> = {
  DRAFT: 'muted',
  REGISTRATION_OPEN: 'accent',
  REGISTRATION_CLOSED: 'muted',
  CHECKIN_OPEN: 'accent',
  IN_PROGRESS: 'live',
  COMPLETED: 'muted',
  CANCELLED: 'muted',
};

export const registrationStatusLabels: Record<RegistrationStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  WAITLISTED: 'Lista de espera',
};

export const registrationStatusTone: Record<RegistrationStatus, 'accent' | 'live' | 'muted'> = {
  PENDING: 'live',
  CONFIRMED: 'accent',
  CANCELLED: 'muted',
  WAITLISTED: 'live',
};

export const checkinMethodLabels: Record<CheckinMethod, string> = {
  MANUAL_CODE: 'Código manual',
  QR_CODE: 'QR Code',
};

export const matchResultLabels: Record<MatchResult, string> = {
  WIN: 'Vitória',
  LOSS: 'Derrota',
};

export const matchResultTone: Record<MatchResult, 'accent' | 'live' | 'muted'> = {
  WIN: 'accent',
  LOSS: 'muted',
};

export const redemptionStatusLabels: Record<RedemptionStatus, string> = {
  PENDING: 'Pendente',
  FULFILLED: 'Cumprido',
  CANCELLED: 'Cancelado',
};

export const redemptionStatusTone: Record<RedemptionStatus, 'accent' | 'live' | 'muted'> = {
  PENDING: 'live',
  FULFILLED: 'accent',
  CANCELLED: 'muted',
};

// Nome genérico (não "storeItem...") porque o mesmo mapeamento serve pra
// qualquer entidade com isActive booleano (loja, comunidades) — evita
// duplicar o helper por tela.
export function activeStatusChip(isActive: boolean): {
  label: string;
  tone: 'accent' | 'muted';
} {
  return isActive ? { label: 'Ativo', tone: 'accent' } : { label: 'Inativo', tone: 'muted' };
}

export const reportedContentTypeLabels: Record<ReportedContentType, string> = {
  POST: 'Post',
  COMMENT: 'Comentário',
  CHAT_MESSAGE: 'Chat geral',
  DIRECT_MESSAGE: 'Mensagem privada',
  NEWS_COMMENT: 'Comentário de notícia',
};

export const reportStatusLabels: Record<ReportStatus, string> = {
  PENDING: 'Pendente',
  DISMISSED: 'Dispensada',
  RESOLVED: 'Resolvida',
};

export const reportStatusTone: Record<ReportStatus, 'accent' | 'live' | 'muted'> = {
  PENDING: 'live',
  DISMISSED: 'muted',
  RESOLVED: 'accent',
};

// Mesmo racional de activeStatusChip acima — nome genérico pra qualquer
// entidade com isMuted booleano (hoje só User, RF-25 Fatia B).
export function mutedStatusChip(isMuted: boolean): {
  label: string;
  tone: 'accent' | 'muted';
} {
  return isMuted ? { label: 'Silenciado', tone: 'muted' } : { label: 'Normal', tone: 'accent' };
}

// RF-06: action/entityType do log de auditoria são string livre na API (não
// enum Prisma), então os mapas cobrem só os valores conhecidos hoje — um
// valor fora do mapa cai no próprio texto bruto (ver auditLogActionLabel/
// auditLogEntityTypeLabel abaixo), nunca quebra a tela.
const auditLogActionLabels: Record<AuditLogAction, string> = {
  MATCH_RESULT_CORRECTED: 'Resultado de partida corrigido',
  USER_BANNED: 'Usuário banido',
  USER_UNBANNED: 'Usuário desbanido',
  USER_MUTED: 'Usuário silenciado',
  USER_UNMUTED: 'Usuário dessilenciado',
  USER_DELETED: 'Usuário excluído',
  USER_RESTORED: 'Usuário restaurado',
  USER_EDITED_BY_ADMIN: 'Dados de usuário editados',
  CONTENT_REMOVED: 'Conteúdo removido',
};

export function auditLogActionLabel(action: string): string {
  return auditLogActionLabels[action as AuditLogAction] ?? action;
}

const auditLogEntityTypeLabels: Record<AuditLogEntityType, string> = {
  MATCH: 'Partida',
  USER: 'Usuário',
  POST: 'Post',
  COMMENT: 'Comentário',
  CHAT_MESSAGE: 'Chat geral',
  DIRECT_MESSAGE: 'Mensagem privada',
  NEWS_COMMENT: 'Comentário de notícia',
};

export function auditLogEntityTypeLabel(entityType: string): string {
  return auditLogEntityTypeLabels[entityType as AuditLogEntityType] ?? entityType;
}

export const AUDIT_LOG_ACTION_OPTIONS = Object.keys(auditLogActionLabels) as AuditLogAction[];
export const AUDIT_LOG_ENTITY_TYPE_OPTIONS = Object.keys(
  auditLogEntityTypeLabels,
) as AuditLogEntityType[];

// RF-16 — só renderiza um chip quando o usuário está excluído (soft
// delete); null significa "não mostrar nada", diferente de
// activeStatusChip/mutedStatusChip que sempre têm os dois estados.
export function deletedStatusChip(deletedAt: string | null): { label: string; tone: 'live' } | null {
  return deletedAt ? { label: 'Excluído', tone: 'live' } : null;
}
