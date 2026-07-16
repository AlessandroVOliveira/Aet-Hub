import type { CheckinMethod, Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

const registrationLookupInclude = {
  checkin: true,
  tournament: { select: { id: true, name: true, checkinDeadlineAt: true } },
  user: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
} satisfies Prisma.RegistrationInclude;

export function findRegistrationByToken(tx: Prisma.TransactionClient, qrCodeToken: string) {
  return tx.registration.findUnique({
    where: { qrCodeToken },
    include: registrationLookupInclude,
  });
}

export function createCheckin(
  tx: Prisma.TransactionClient,
  data: { registrationId: string; method: CheckinMethod; checkedInByUserId: string },
) {
  return tx.checkin.create({
    data: { ...data, checkedInAt: new Date() },
    include: { registration: { include: registrationLookupInclude } },
  });
}

export function listRegistrationsByTournament(tx: Prisma.TransactionClient, tournamentId: string) {
  return tx.registration.findMany({
    where: { tournamentId },
    include: {
      checkin: true,
      user: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
    },
    orderBy: { registeredAt: 'asc' },
  });
}
