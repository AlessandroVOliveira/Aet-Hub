import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(60).optional(),
  favoriteGameId: z.string().trim().min(1).nullable().optional(),
  favoriteCharacter: z.string().trim().max(60).nullable().optional(),
  theme: z.string().trim().max(30).nullable().optional(),
  avatarUrl: z.string().trim().url('URL do avatar inválida').nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// RF-25 (Fatia B): admin bane/reativa (isActive) e/ou silencia/dessilencia
// (isMuted) um usuário, sempre com motivo registrado (AuditLog).
export const moderateUserSchema = z
  .object({
    isActive: z.boolean().optional(),
    isMuted: z.boolean().optional(),
    reason: z.string().trim().min(5, 'Descreva o motivo com pelo menos 5 caracteres').max(500),
  })
  .refine((data) => data.isActive !== undefined || data.isMuted !== undefined, {
    message: 'Informe isActive ou isMuted',
  });

export type ModerateUserInput = z.infer<typeof moderateUserSchema>;
