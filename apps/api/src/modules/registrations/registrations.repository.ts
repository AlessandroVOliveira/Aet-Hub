import type { Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

const registrationWithTournamentInclude = {
  tournament: { select: { id: true, name: true, eventStartAt: true, status: true } },
  checkin: true,
} satisfies Prisma.RegistrationInclude;

export function findRegistrationByCompositeKey(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  userId: string,
) {
  return tx.registration.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
  });
}

export function createRegistration(
  tx: Prisma.TransactionClient,
  data: { tournamentId: string; userId: string; qrCodeToken: string },
) {
  return tx.registration.create({
    data: { ...data, status: 'CONFIRMED' },
    include: registrationWithTournamentInclude,
  });
}

// Reinscrição após cancelamento: reativa o registro existente em vez de
// tentar um novo INSERT, que colidiria com @@unique([tournamentId, userId]).
// Gera um novo qrCodeToken porque o antigo pode já ter circulado.
export function reactivateRegistration(tx: Prisma.TransactionClient, id: string, qrCodeToken: string) {
  return tx.registration.update({
    where: { id },
    data: { status: 'CONFIRMED', qrCodeToken, registeredAt: new Date(), cancelledAt: null },
    include: registrationWithTournamentInclude,
  });
}

export function listMyRegistrations(tx: Prisma.TransactionClient, userId: string) {
  return tx.registration.findMany({
    where: { userId },
    include: registrationWithTournamentInclude,
    orderBy: { registeredAt: 'desc' },
  });
}

export function cancelRegistration(tx: Prisma.TransactionClient, id: string) {
  return tx.registration.update({
    where: { id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
    include: registrationWithTournamentInclude,
  });
}
