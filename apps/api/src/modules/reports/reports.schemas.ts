import { z } from 'zod';

export const createReportSchema = z.object({
  contentType: z.enum(['POST', 'COMMENT', 'CHAT_MESSAGE', 'DIRECT_MESSAGE', 'NEWS_COMMENT']),
  contentId: z.string().trim().min(1, 'Informe o conteúdo denunciado'),
  reason: z
    .string()
    .trim()
    .min(5, 'Descreva o motivo com pelo menos 5 caracteres')
    .max(500, 'Motivo pode ter no máximo 500 caracteres'),
});
export type CreateReportInput = z.infer<typeof createReportSchema>;
