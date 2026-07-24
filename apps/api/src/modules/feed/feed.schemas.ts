import { z } from 'zod';

// Texto puro, sem sanitização de HTML aqui — o frontend renderiza sempre
// como texto React (regra de XSS do CLAUDE.md), nunca dangerouslySetInnerHTML.
export const createNewsCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comentário não pode ser vazio')
    .max(500, 'Comentário pode ter no máximo 500 caracteres'),
});
export type CreateNewsCommentInput = z.infer<typeof createNewsCommentSchema>;
