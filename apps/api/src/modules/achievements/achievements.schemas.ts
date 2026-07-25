import { z } from 'zod';

const achievementFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da conquista').max(120),
  description: z.string().trim().min(1, 'Informe a descrição').max(300),
  rarity: z.enum(['COMMON', 'RARE']).default('COMMON'),
});

// `code` é a chave usada pelo avaliador hardcoded (achievement-evaluator.ts)
// pra saber QUANDO desbloquear — não um critério editável pelo admin, então
// só existe na criação, nunca no update.
export const createAchievementSchema = achievementFieldsSchema.extend({
  code: z.string().trim().min(1, 'Informe o código').max(60),
  isActive: z.boolean().default(true),
});
export type CreateAchievementInput = z.infer<typeof createAchievementSchema>;

export const updateAchievementSchema = achievementFieldsSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateAchievementInput = z.infer<typeof updateAchievementSchema>;
