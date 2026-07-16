import { z } from 'zod';

export const recordMatchResultSchema = z.object({
  winnerRegistrationId: z.string().trim().min(1, 'Informe o vencedor'),
  scoreA: z.number().int().min(0).optional(),
  scoreB: z.number().int().min(0).optional(),
});

export type RecordMatchResultInput = z.infer<typeof recordMatchResultSchema>;
