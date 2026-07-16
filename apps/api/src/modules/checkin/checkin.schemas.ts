import { z } from 'zod';
import { CheckinMethod } from '@prisma/client';

export const createCheckinSchema = z.object({
  qrCodeToken: z.string().trim().min(1, 'Informe o código de checkin'),
  method: z.nativeEnum(CheckinMethod),
});

export type CreateCheckinInput = z.infer<typeof createCheckinSchema>;
