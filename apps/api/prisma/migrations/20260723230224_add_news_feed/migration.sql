-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('GENERAL', 'ESPORTS');

-- CreateTable
CREATE TABLE "news_items" (
    "id" TEXT NOT NULL,
    "category" "NewsCategory" NOT NULL,
    "external_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "image_url" TEXT,
    "source_domain" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_comments" (
    "id" TEXT NOT NULL,
    "news_item_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "author_display_name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "news_items_category_published_at_idx" ON "news_items"("category", "published_at");

-- CreateIndex
CREATE INDEX "news_items_category_fetched_at_idx" ON "news_items"("category", "fetched_at");

-- CreateIndex
CREATE UNIQUE INDEX "news_items_category_external_id_key" ON "news_items"("category", "external_id");

-- CreateIndex
CREATE INDEX "news_comments_news_item_id_created_at_idx" ON "news_comments"("news_item_id", "created_at");

-- AddForeignKey
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_news_item_id_fkey" FOREIGN KEY ("news_item_id") REFERENCES "news_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
