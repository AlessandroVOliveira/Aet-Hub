-- AlterTable
ALTER TABLE "registrations" ADD COLUMN     "final_placement" INTEGER;

-- CreateTable
CREATE TABLE "tournament_photos" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournament_photos_tournament_id_idx" ON "tournament_photos"("tournament_id");

-- AddForeignKey
ALTER TABLE "tournament_photos" ADD CONSTRAINT "tournament_photos_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_photos" ADD CONSTRAINT "tournament_photos_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
