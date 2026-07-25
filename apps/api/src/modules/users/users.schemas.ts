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
// (isMuted) um usuário, sempre com motivo registrado (AuditLog). RF-16
// estende com `deleted` (soft delete/restauração via User.deletedAt) —
// mesma infraestrutura de ação administrativa reversível com motivo, em
// vez de uma rota DELETE dedicada.
export const moderateUserSchema = z
  .object({
    isActive: z.boolean().optional(),
    isMuted: z.boolean().optional(),
    deleted: z.boolean().optional(),
    reason: z.string().trim().min(5, 'Descreva o motivo com pelo menos 5 caracteres').max(500),
  })
  .refine(
    (data) => data.isActive !== undefined || data.isMuted !== undefined || data.deleted !== undefined,
    { message: 'Informe isActive, isMuted ou deleted' },
  );

export type ModerateUserInput = z.infer<typeof moderateUserSchema>;

// RF-16: admin edita username/e-mail (User) e/ou campos de Profile de
// qualquer jogador, com motivo obrigatório (mesmo padrão de
// moderateUserSchema). username segue a mesma regra de auth.schemas.ts,
// email é normalizado em minúsculas antes de checar unicidade.
export const adminUpdateUserSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Nome de usuário precisa ter pelo menos 3 caracteres')
      .max(30, 'Nome de usuário pode ter no máximo 30 caracteres')
      .regex(/^[a-zA-Z0-9_]+$/, 'Nome de usuário só pode ter letras, números e underscore')
      .optional(),
    email: z.string().trim().toLowerCase().email('E-mail inválido').optional(),
    displayName: z.string().trim().min(2).max(60).optional(),
    favoriteGameId: z.string().trim().min(1).nullable().optional(),
    favoriteCharacter: z.string().trim().max(60).nullable().optional(),
    theme: z.string().trim().max(30).nullable().optional(),
    avatarUrl: z.string().trim().url('URL do avatar inválida').nullable().optional(),
    bio: z.string().trim().max(500).nullable().optional(),
    reason: z.string().trim().min(5, 'Descreva o motivo com pelo menos 5 caracteres').max(500),
  })
  .refine(
    (data) =>
      [
        data.username,
        data.email,
        data.displayName,
        data.favoriteGameId,
        data.favoriteCharacter,
        data.theme,
        data.avatarUrl,
        data.bio,
      ].some((value) => value !== undefined),
    { message: 'Informe ao menos um campo para editar' },
  );

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
