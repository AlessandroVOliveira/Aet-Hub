import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
  AUTH_DATABASE_URL: z.string().min(1, 'AUTH_DATABASE_URL é obrigatório'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET precisa ter pelo menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().min(1).default('1d'),
  VITE_API_URL: z.string().url().optional(),
  UPLOAD_DIR: z.string().min(1).default('uploads'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Variáveis de ambiente inválidas:\n${issues.join('\n')}`);
}

export const env = parsed.data;
