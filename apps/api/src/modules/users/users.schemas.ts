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
