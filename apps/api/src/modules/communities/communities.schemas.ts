import { z } from 'zod';

const communityFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da comunidade').max(120),
  description: z.string().trim().min(1, 'Informe a descrição').max(2000),
  // Comunidade "de assunto" sem jogo é permitida (RF-23) — null limpa o
  // vínculo, undefined mantém o valor atual num update parcial.
  gameId: z.string().trim().min(1).nullable().optional(),
});

export const createCommunitySchema = communityFieldsSchema.extend({
  isActive: z.boolean().default(true),
});
export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;

export const updateCommunitySchema = communityFieldsSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;
