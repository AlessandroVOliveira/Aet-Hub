import { z } from 'zod';

const cosmeticItemFieldsSchema = z.object({
  kind: z.enum(['FRAME', 'BANNER', 'TITLE', 'FONT', 'EFFECT', 'MASCOT']),
  name: z.string().trim().min(1, 'Informe o nome do cosmético').max(120),
  description: z.string().trim().min(1, 'Informe a descrição').max(300),
  rarity: z.enum(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']).default('COMMON'),
  priceInPoints: z.number().int().min(0, 'Preço não pode ser negativo'),
  className: z.string().trim().max(200).optional(),
  // Referência solta a Achievement.code (sem FK) — item destravado por
  // conquista em vez de comprável com pontos, ver CLAUDE.md.
  unlockAchievementCode: z.string().trim().max(60).optional(),
});

export const createCosmeticItemSchema = cosmeticItemFieldsSchema.extend({
  isActive: z.boolean().default(true),
});
export type CreateCosmeticItemInput = z.infer<typeof createCosmeticItemSchema>;

export const updateCosmeticItemSchema = cosmeticItemFieldsSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateCosmeticItemInput = z.infer<typeof updateCosmeticItemSchema>;

export const purchaseCosmeticItemSchema = z.object({
  cosmeticItemId: z.string().trim().min(1, 'Informe o item'),
});
export type PurchaseCosmeticItemInput = z.infer<typeof purchaseCosmeticItemSchema>;

// null explícito desequipa o slot; undefined (campo ausente) deixa o slot
// como está — mesma convenção de "só monta os campos que vieram no
// payload" já usada em updateMyProfile/updateUserByAdmin.
export const updateLoadoutSchema = z.object({
  frameId: z.string().trim().min(1).nullable().optional(),
  titleId: z.string().trim().min(1).nullable().optional(),
});
export type UpdateLoadoutInput = z.infer<typeof updateLoadoutSchema>;
