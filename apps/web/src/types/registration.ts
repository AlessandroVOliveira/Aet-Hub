import type { CheckinMethod } from './checkin';

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';

export interface RegistrationTournamentSummary {
  id: string;
  name: string;
  eventStartAt: string;
  status: string;
}

export interface RegistrationCheckin {
  id: string;
  registrationId: string;
  method: CheckinMethod;
  checkedInByUserId: string;
  checkedInAt: string;
  createdAt: string;
}

export interface Registration {
  id: string;
  tournamentId: string;
  userId: string;
  status: RegistrationStatus;
  qrCodeToken: string;
  registeredAt: string;
  cancelledAt: string | null;
  finalPlacement: number | null;
  createdAt: string;
  updatedAt: string;
  tournament: RegistrationTournamentSummary;
  checkin: RegistrationCheckin | null;
}

export interface GetMyRegistrationsResponse {
  registrations: Registration[];
}

export interface CreateRegistrationPayload {
  tournamentId: string;
}

export interface CreateRegistrationResponse {
  registration: Registration;
}

export interface CancelRegistrationResponse {
  registration: Registration;
}
