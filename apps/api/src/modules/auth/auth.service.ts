import { Prisma, type Role } from '@prisma/client';
import { AppError } from '../../utils/app-error.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { validateAlegreteAddress } from '../../utils/cep.js';
import { signAccessToken } from './jwt.js';
import {
  createUserWithProfileAndAddress,
  findUserByUsername,
  findUserByEmail,
} from './auth.repository.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: Role;
}

export async function register(input: RegisterInput): Promise<AuthenticatedUser> {
  const [existingByUsername, existingByEmail] = await Promise.all([
    findUserByUsername(input.username),
    findUserByEmail(input.email),
  ]);

  if (existingByUsername) {
    throw new AppError('Nome de usuário já está em uso', 409);
  }

  if (existingByEmail) {
    throw new AppError('E-mail já está em uso', 409);
  }

  const address = await validateAlegreteAddress(input.cep);
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await createUserWithProfileAndAddress({
      username: input.username,
      passwordHash,
      email: input.email,
      displayName: input.displayName ?? input.username,
      address: {
        cep: address.cep,
        street: address.street,
        number: input.addressNumber,
        complement: input.addressComplement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        cepValidatedVia: address.validatedVia,
      },
    });

    return { id: user.id, username: user.username, role: user.role };
  } catch (error) {
    // Defesa contra corrida entre o check de unicidade acima e o INSERT:
    // duas requisições simultâneas com o mesmo username podem passar pelo
    // check e só colidir aqui, na constraint do banco.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('Nome de usuário ou e-mail já está em uso', 409);
    }
    throw error;
  }
}

export async function login(
  input: LoginInput,
): Promise<{ token: string; user: AuthenticatedUser }> {
  const user = await findUserByUsername(input.username);

  // Mensagem genérica proposital: nunca revelar se foi usuário inexistente
  // ou senha errada.
  if (!user) {
    throw new AppError('Usuário ou senha inválidos', 401);
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError('Usuário ou senha inválidos', 401);
  }

  const token = signAccessToken({ id: user.id, role: user.role });

  return { token, user: { id: user.id, username: user.username, role: user.role } };
}
