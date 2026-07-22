import { z } from 'zod';

export const sendChatMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Mensagem não pode ser vazia')
    .max(500, 'Mensagem pode ter no máximo 500 caracteres'),
});
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
