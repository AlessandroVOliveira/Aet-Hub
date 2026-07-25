-- AlterEnum
ALTER TYPE "ReportStatus" ADD VALUE 'RESOLVED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_muted" BOOLEAN NOT NULL DEFAULT false;
