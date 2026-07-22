import type { CheckinMethod } from '@/types/checkin';
import type { MatchResult } from '@/types/profile';
import type { RegistrationStatus } from '@/types/registration';
import type { RedemptionStatus } from '@/types/store';
import type { BracketType, TiebreakerRule, TournamentStatus } from '@/types/tournament';

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

export function storeItemActiveChip(isActive: boolean): {
  label: string;
  tone: 'accent' | 'muted';
} {
  return isActive ? { label: 'Ativo', tone: 'accent' } : { label: 'Inativo', tone: 'muted' };
}
