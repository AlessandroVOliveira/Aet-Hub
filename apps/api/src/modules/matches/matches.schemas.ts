import { z } from 'zod';

export const recordMatchResultSchema = z.object({
  winnerRegistrationId: z.string().trim().min(1, 'Informe o vencedor'),
  scoreA: z.number().int().min(0).optional(),
  scoreB: z.number().int().min(0).optional(),
});

export type RecordMatchResultInput = z.infer<typeof recordMatchResultSchema>;

// RF-19: motivo obrigatório em toda correção de resultado já registrado,
// mesma convenção de reason de reports.schemas.ts/users.schemas.ts.
export const correctMatchResultSchema = z.object({
  winnerRegistrationId: z.string().trim().min(1, 'Informe o vencedor'),
  scoreA: z.number().int().min(0).optional(),
  scoreB: z.number().int().min(0).optional(),
  reason: z
    .string()
    .trim()
    .min(5, 'Descreva o motivo com pelo menos 5 caracteres')
    .max(500, 'Motivo pode ter no máximo 500 caracteres'),
});

export type CorrectMatchResultInput = z.infer<typeof correctMatchResultSchema>;
