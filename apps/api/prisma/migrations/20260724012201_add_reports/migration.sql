-- CreateEnum
CREATE TYPE "ReportedContentType" AS ENUM ('POST', 'COMMENT', 'CHAT_MESSAGE', 'DIRECT_MESSAGE', 'NEWS_COMMENT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'DISMISSED');

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reporter_display_name" TEXT NOT NULL,
    "content_type" "ReportedContentType" NOT NULL,
    "content_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "content_snapshot" TEXT NOT NULL,
    "content_author_id" TEXT NOT NULL,
    "content_author_display_name" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_user_id" TEXT,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reports_reporter_id_content_type_content_id_key" ON "reports"("reporter_id", "content_type", "content_id");
