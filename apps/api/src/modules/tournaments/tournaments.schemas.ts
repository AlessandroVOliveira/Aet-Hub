import { z } from 'zod';
import { BracketType, TiebreakerRule, TournamentStatus } from '@prisma/client';

const sponsorSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do apoiador').max(100),
  logoUrl: z.string().trim().url('URL do logo inválida'),
  link: z.string().trim().url('Link inválido').optional(),
});

const placementRewardSchema = z.object({
  placement: z.number().int().positive('Colocação precisa ser maior que zero'),
  potPercentage: z
    .number()
    .min(0, 'Percentual do pot não pode ser negativo')
    .max(100, 'Percentual do pot não pode passar de 100'),
  bonusPoints: z.number().int().min(0, 'Bônus de pontos não pode ser negativo').default(0),
});

const tournamentFieldsSchema = z.object({
  name: z.string().trim().min(3, 'Nome precisa ter pelo menos 3 caracteres').max(120),
  gameId: z.string().trim().min(1, 'Informe o jogo'),
  description: z.string().trim().max(2000).optional(),
  registrationStartAt: z.coerce.date(),
  registrationEndAt: z.coerce.date(),
  checkinDeadlineAt: z.coerce.date(),
  eventStartAt: z.coerce.date(),
  entryFeeCents: z.number().int().min(0, 'Valor de inscrição não pode ser negativo'),
  bracketType: z.nativeEnum(BracketType),
  tiebreakerRule: z.nativeEnum(TiebreakerRule).optional(),
  pointsPerWin: z.number().int().min(0, 'Pontuação por vitória não pode ser negativa'),
  pointsPerLoss: z.number().int().min(0, 'Pontuação por derrota não pode ser negativa'),
  sponsors: z.array(sponsorSchema).default([]),
  placementRewards: z.array(placementRewardSchema).default([]),
});

// Regras que dependem de mais de um campo — comuns a criação e edição, por
// isso extraídas para reaproveitar entre os dois schemas via superRefine.
function applyCrossFieldValidation(
  data: z.infer<typeof tournamentFieldsSchema>,
  ctx: z.RefinementCtx,
): void {
  if (data.registrationStartAt >= data.registrationEndAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['registrationEndAt'],
      message: 'Fim das inscrições precisa ser depois do início',
    });
  }

  if (data.checkinDeadlineAt < data.registrationEndAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['checkinDeadlineAt'],
      message: 'Prazo de checkin não pode ser antes do fim das inscrições',
    });
  }

  if (data.eventStartAt < data.checkinDeadlineAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['eventStartAt'],
      message: 'Início do evento não pode ser antes do prazo de checkin',
    });
  }

  const potPercentageTotal = data.placementRewards.reduce(
    (sum, reward) => sum + reward.potPercentage,
    0,
  );
  if (potPercentageTotal > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['placementRewards'],
      message: 'A soma dos percentuais do pot não pode passar de 100',
    });
  }

  const placements = data.placementRewards.map((reward) => reward.placement);
  if (new Set(placements).size !== placements.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['placementRewards'],
      message: 'Não pode haver colocações repetidas',
    });
  }
}

export const createTournamentSchema = tournamentFieldsSchema.superRefine(applyCrossFieldValidation);
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

// IN_PROGRESS/COMPLETED nunca são setáveis por este PUT genérico — só pelos
// fluxos dedicados (POST /:id/start, que gera a chave, e POST /:id/complete,
// que calcula colocação/pontos/XP). Um PUT que aceitasse esses dois valores
// deixaria o torneio "iniciado" sem nenhum BracketSlot/Match (foi assim que
// o torneio "Tekken 8 (cópia)" ficou com chave nunca gerada).
const MANUALLY_SETTABLE_STATUSES: TournamentStatus[] = [
  TournamentStatus.DRAFT,
  TournamentStatus.REGISTRATION_OPEN,
  TournamentStatus.REGISTRATION_CLOSED,
  TournamentStatus.CHECKIN_OPEN,
  TournamentStatus.CANCELLED,
];

export const updateTournamentSchema = tournamentFieldsSchema
  .extend({
    status: z
      .nativeEnum(TournamentStatus)
      .refine((status) => MANUALLY_SETTABLE_STATUSES.includes(status), {
        message: 'Este status só pode ser definido pelos fluxos de iniciar/encerrar torneio',
      })
      .optional(),
  })
  .superRefine(applyCrossFieldValidation);
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
