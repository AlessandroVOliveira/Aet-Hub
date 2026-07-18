import { apiRequest } from './http';
import type {
  CreateTournamentPayload,
  GetTournamentResponse,
  GetTournamentsResponse,
  TournamentDetail,
  UpdateTournamentPayload,
} from '@/types/tournament';

export function listAdminTournaments(token: string): Promise<GetTournamentsResponse> {
  return apiRequest('/tournaments', { method: 'GET', token });
}

export function getAdminTournament(token: string, id: string): Promise<GetTournamentResponse> {
  return apiRequest(`/tournaments/${id}`, { method: 'GET', token });
}

export function createAdminTournament(
  token: string,
  payload: CreateTournamentPayload,
): Promise<GetTournamentResponse> {
  return apiRequest('/tournaments', { method: 'POST', token, body: payload });
}

export function updateAdminTournament(
  token: string,
  id: string,
  payload: UpdateTournamentPayload,
): Promise<GetTournamentResponse> {
  return apiRequest(`/tournaments/${id}`, { method: 'PUT', token, body: payload });
}

export function deleteAdminTournament(token: string, id: string): Promise<void> {
  return apiRequest(`/tournaments/${id}`, { method: 'DELETE', token });
}

// Ponto único de conversão de um TournamentDetail (leitura) para um payload
// de PUT válido e completo — usado tanto pela troca rápida de status quanto
// pelo formulário de edição, pra nunca montar um replace parcial que apague
// sponsors/placementRewards sem querer.
export function toUpdatePayload(
  detail: TournamentDetail,
  overrides?: Partial<UpdateTournamentPayload>,
): UpdateTournamentPayload {
  const payload: UpdateTournamentPayload = {
    name: detail.name,
    gameId: detail.gameId,
    description: detail.description ?? undefined,
    registrationStartAt: detail.registrationStartAt,
    registrationEndAt: detail.registrationEndAt,
    checkinDeadlineAt: detail.checkinDeadlineAt,
    eventStartAt: detail.eventStartAt,
    entryFeeCents: detail.entryFeeCents,
    bracketType: detail.bracketType,
    tiebreakerRule: detail.tiebreakerRule ?? undefined,
    pointsPerWin: detail.pointsPerWin,
    pointsPerLoss: detail.pointsPerLoss,
    status: detail.status,
    sponsors: detail.sponsors.map((sponsor) => ({
      name: sponsor.name,
      logoUrl: sponsor.logoUrl,
      link: sponsor.link ?? undefined,
    })),
    placementRewards: detail.placementRewards.map((reward) => ({
      placement: reward.placement,
      potPercentage: Number(reward.potPercentage),
      bonusPoints: reward.bonusPoints,
    })),
  };

  return { ...payload, ...overrides };
}
