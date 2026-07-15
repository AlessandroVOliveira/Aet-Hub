import { authPrisma } from '../../config/prisma.js';

export interface CreateUserInput {
  username: string;
  passwordHash: string;
  email: string;
  displayName: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    cepValidatedVia: string;
  };
}

// Todas as queries deste módulo passam pela role aet_hub_auth (RLS
// escopada só para login/cadastro) — nunca usar o `prisma` singleton aqui.
export function findUserByUsername(username: string) {
  return authPrisma.user.findUnique({ where: { username } });
}

export function findUserByEmail(email: string) {
  return authPrisma.user.findUnique({ where: { email } });
}

export function createUserWithProfileAndAddress(input: CreateUserInput) {
  return authPrisma.user.create({
    data: {
      username: input.username,
      passwordHash: input.passwordHash,
      email: input.email,
      termsAcceptedAt: new Date(),
      profile: {
        create: { displayName: input.displayName },
      },
      address: {
        create: input.address,
      },
    },
  });
}
