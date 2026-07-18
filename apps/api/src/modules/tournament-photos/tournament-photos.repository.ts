import type { Prisma } from '@prisma/client';

// Todo método recebe a transação interativa aberta por withRls — nunca
// importar o `prisma` singleton aqui.

export function createTournamentPhoto(
  tx: Prisma.TransactionClient,
  data: {
    tournamentId: string;
    uploadedByUserId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  },
) {
  return tx.tournamentPhoto.create({ data });
}

export function listTournamentPhotos(tx: Prisma.TransactionClient, tournamentId: string) {
  return tx.tournamentPhoto.findMany({ where: { tournamentId }, orderBy: { createdAt: 'asc' } });
}

export function findTournamentPhotoById(tx: Prisma.TransactionClient, id: string) {
  return tx.tournamentPhoto.findUnique({ where: { id } });
}
