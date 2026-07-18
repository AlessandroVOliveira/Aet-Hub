import { z } from 'zod';

const storeItemFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do item').max(120),
  description: z.string().trim().min(1, 'Informe a descrição').max(2000),
  costInCoins: z.number().int().positive('Custo precisa ser maior que zero'),
  stock: z.number().int().nonnegative('Estoque não pode ser negativo').nullable().optional(),
  imageUrl: z.string().trim().url('URL da imagem inválida').optional(),
  partnerName: z.string().trim().max(120).optional(),
});

export const createStoreItemSchema = storeItemFieldsSchema.extend({
  isActive: z.boolean().default(true),
});
export type CreateStoreItemInput = z.infer<typeof createStoreItemSchema>;

export const updateStoreItemSchema = storeItemFieldsSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateStoreItemInput = z.infer<typeof updateStoreItemSchema>;

export const redeemStoreItemSchema = z.object({
  storeItemId: z.string().trim().min(1, 'Informe o item'),
});
export type RedeemStoreItemInput = z.infer<typeof redeemStoreItemSchema>;

export const updateRedemptionStatusSchema = z.object({
  status: z.enum(['FULFILLED', 'CANCELLED']),
});
export type UpdateRedemptionStatusInput = z.infer<typeof updateRedemptionStatusSchema>;
