import type { TournamentStatus } from '@/types/tournament';

interface QuickStatusAction {
  label: string;
  next: TournamentStatus;
  destructive?: boolean;
}

// Só as transições "normais" da progressão de um torneio, feitas via PUT
// genérico (updateAdminTournament). CHECKIN_OPEN -> IN_PROGRESS fica de fora
// de propósito — esse botão vive em AdminTournamentsPage.tsx
// (useStartTournament, POST /:id/start), porque gera a chave de verdade
// (BracketSlot/Match), o que o PUT genérico nunca faz. Cancelar só é
// oferecido antes de IN_PROGRESS — cancelar com chave já gerada tem efeitos
// colaterais em Match/Registration não modelados aqui.
export const QUICK_STATUS_ACTIONS: Partial<Record<TournamentStatus, QuickStatusAction[]>> = {
  DRAFT: [
    { label: 'Abrir inscrições', next: 'REGISTRATION_OPEN' },
    { label: 'Cancelar', next: 'CANCELLED', destructive: true },
  ],
  REGISTRATION_OPEN: [
    { label: 'Fechar inscrições', next: 'REGISTRATION_CLOSED' },
    { label: 'Cancelar', next: 'CANCELLED', destructive: true },
  ],
  REGISTRATION_CLOSED: [
    { label: 'Abrir check-in', next: 'CHECKIN_OPEN' },
    { label: 'Cancelar', next: 'CANCELLED', destructive: true },
  ],
  CHECKIN_OPEN: [{ label: 'Cancelar', next: 'CANCELLED', destructive: true }],
};
