import { z } from 'zod';

const gameFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do jogo').max(120),
});

export const createGameSchema = gameFieldsSchema.extend({
  isActive: z.boolean().default(true),
});
export type CreateGameInput = z.infer<typeof createGameSchema>;

export const updateGameSchema = gameFieldsSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateGameInput = z.infer<typeof updateGameSchema>;
