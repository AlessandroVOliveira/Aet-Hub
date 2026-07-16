import { z } from 'zod';

export const createRegistrationSchema = z.object({
  tournamentId: z.string().trim().min(1, 'Informe o torneio'),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
