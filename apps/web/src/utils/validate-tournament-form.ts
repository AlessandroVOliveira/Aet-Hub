import type { TournamentFormFields } from '@/types/tournament';

export interface FormIssue {
  path: (string | number)[];
  message: string;
}

// Replica as regras cross-field do zod do backend (tournaments.schemas.ts)
// pra feedback rápido no formulário — o backend continua sendo a fonte da
// verdade, esta validação é só uma cópia pra UX.
export function validateTournamentCrossFields(values: TournamentFormFields): FormIssue[] {
  const issues: FormIssue[] = [];

  const registrationStartAt = new Date(values.registrationStartAt);
  const registrationEndAt = new Date(values.registrationEndAt);
  const checkinDeadlineAt = new Date(values.checkinDeadlineAt);
  const eventStartAt = new Date(values.eventStartAt);

  if (registrationEndAt <= registrationStartAt) {
    issues.push({
      path: ['registrationEndAt'],
      message: 'Precisa ser depois do início das inscrições',
    });
  }

  if (checkinDeadlineAt < registrationEndAt) {
    issues.push({
      path: ['checkinDeadlineAt'],
      message: 'Precisa ser igual ou depois do fim das inscrições',
    });
  }

  if (eventStartAt < checkinDeadlineAt) {
    issues.push({
      path: ['eventStartAt'],
      message: 'Precisa ser igual ou depois do prazo de check-in',
    });
  }

  const totalPotPercentage = values.placementRewards.reduce(
    (sum, reward) => sum + reward.potPercentage,
    0,
  );
  if (totalPotPercentage > 100) {
    issues.push({
      path: ['placementRewards'],
      message: 'A soma dos percentuais do pot não pode passar de 100%',
    });
  }

  const placements = values.placementRewards.map((reward) => reward.placement);
  if (new Set(placements).size !== placements.length) {
    issues.push({
      path: ['placementRewards'],
      message: 'Não pode haver colocações repetidas na premiação',
    });
  }

  return issues;
}
