import { z } from 'zod';

// recipientId vem da URL (:userId), não do body — só o conteúdo é
// validado aqui.
export const sendDirectMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Mensagem não pode ser vazia')
    .max(500, 'Mensagem pode ter no máximo 500 caracteres'),
});
export type SendDirectMessageInput = z.infer<typeof sendDirectMessageSchema>;
