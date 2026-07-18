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
