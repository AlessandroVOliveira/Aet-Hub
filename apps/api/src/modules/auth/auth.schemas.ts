import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Nome de usuário precisa ter pelo menos 3 caracteres')
    .max(30, 'Nome de usuário pode ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Nome de usuário só pode ter letras, números e underscore'),
  password: z.string().min(8, 'Senha precisa ter pelo menos 8 caracteres'),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  cep: z.string().trim().min(8, 'CEP inválido'),
  addressNumber: z.string().trim().min(1, 'Informe o número do endereço').max(20),
  addressComplement: z.string().trim().max(120).optional(),
  displayName: z.string().trim().min(2).max(60).optional(),
  acceptedTerms: z.boolean().refine((value) => value === true, {
    message: 'É necessário aceitar os termos de uso',
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Informe o nome de usuário'),
  password: z.string().min(1, 'Informe a senha'),
});

export type LoginInput = z.infer<typeof loginSchema>;
