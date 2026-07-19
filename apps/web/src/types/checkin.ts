import type { Registration } from './registration';

export type CheckinMethod = 'MANUAL_CODE' | 'QR_CODE';

export interface Checkin {
  id: string;
  registrationId: string;
  method: CheckinMethod;
  checkedInByUserId: string;
  checkedInAt: string;
  createdAt: string;
}

export interface CheckinUserSummary {
  id: string;
  username: string;
  profile: { displayName: string } | null;
}

export interface CheckinTournamentSummary {
  id: string;
  name: string;
  checkinDeadlineAt: string;
}

export interface CheckinRegistrationDetail extends Registration {
  tournament: CheckinTournamentSummary & { eventStartAt: string; status: string };
  user: CheckinUserSummary;
}

export interface CreateCheckinPayload {
  qrCodeToken: string;
  method: CheckinMethod;
}

export interface CreateCheckinResponse {
  checkin: Checkin & { registration: CheckinRegistrationDetail };
}

export interface TournamentCheckinRegistration extends Registration {
  user: CheckinUserSummary;
}

export interface GetTournamentCheckinsResponse {
  registrations: TournamentCheckinRegistration[];
}
