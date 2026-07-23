import { withRls } from '../../config/rls.js';
import { AppError } from '../../utils/app-error.js';
import type { AccessTokenPayload } from '../auth/jwt.js';
import * as communitiesRepository from './communities.repository.js';
import type { CreateCommunityInput, UpdateCommunityInput } from './communities.schemas.js';

// Achata _count.posts -> postCount pro formato exposto pela API (o
// repository sempre inclui game + _count via communityListInclude).
function toCommunityView<T extends { _count: { posts: number } }>(
  community: T,
): Omit<T, '_count'> & { postCount: number } {
  const { _count, ...rest } = community;
  return { ...rest, postCount: _count.posts };
}

export async function listCommunities(actor: AccessTokenPayload) {
  const communities = await withRls({ userId: actor.id, role: actor.role }, (tx) =>
    communitiesRepository.listActiveCommunities(tx),
  );
  return communities.map(toCommunityView);
}

export async function listAllCommunities(actor: AccessTokenPayload) {
  const communities = await withRls({ userId: actor.id, role: actor.role }, (tx) =>
    communitiesRepository.listAllCommunities(tx),
  );
  return communities.map(toCommunityView);
}

export async function getCommunity(actor: AccessTokenPayload, id: string) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const community = await communitiesRepository.findCommunityById(tx, id);
    // Comunidade inativa some pra player (mesmo padrão de store items
    // desativados), mas admin precisa continuar enxergando pra reativar.
    if (!community || (!community.isActive && actor.role !== 'ADMIN')) {
      throw new AppError('Comunidade não encontrada', 404);
    }
    return toCommunityView(community);
  });
}

export async function createCommunity(actor: AccessTokenPayload, input: CreateCommunityInput) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    if (input.gameId) {
      const game = await tx.game.findUnique({ where: { id: input.gameId } });
      if (!game) {
        throw new AppError('Jogo não encontrado', 404);
      }
    }

    const community = await communitiesRepository.createCommunity(tx, {
      name: input.name,
      description: input.description,
      gameId: input.gameId ?? null,
      isActive: input.isActive,
    });
    return toCommunityView(community);
  });
}

export async function updateCommunity(
  actor: AccessTokenPayload,
  id: string,
  input: UpdateCommunityInput,
) {
  return withRls({ userId: actor.id, role: actor.role }, async (tx) => {
    const existing = await communitiesRepository.findCommunityById(tx, id);
    if (!existing) {
      throw new AppError('Comunidade não encontrada', 404);
    }

    if (input.gameId) {
      const game = await tx.game.findUnique({ where: { id: input.gameId } });
      if (!game) {
        throw new AppError('Jogo não encontrado', 404);
      }
    }

    const community = await communitiesRepository.updateCommunity(tx, id, input);
    return toCommunityView(community);
  });
}
