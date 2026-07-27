-- CreateEnum
CREATE TYPE "CosmeticKind" AS ENUM ('FRAME', 'BANNER', 'TITLE', 'FONT', 'EFFECT', 'MASCOT');

-- CreateEnum
CREATE TYPE "CosmeticRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- AlterEnum
ALTER TYPE "PointsTransactionType" ADD VALUE 'COSMETIC_PURCHASE';

-- AlterTable
ALTER TABLE "points_transactions" ADD COLUMN     "user_cosmetic_item_id" TEXT;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "equipped_frame_id" TEXT,
ADD COLUMN     "equipped_title_id" TEXT;

-- CreateTable
CREATE TABLE "cosmetic_items" (
    "id" TEXT NOT NULL,
    "kind" "CosmeticKind" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" "CosmeticRarity" NOT NULL DEFAULT 'COMMON',
    "price_in_points" INTEGER NOT NULL,
    "class_name" TEXT,
    "unlock_achievement_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cosmetic_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_cosmetic_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cosmetic_item_id" TEXT NOT NULL,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_cosmetic_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_cosmetic_items_user_id_idx" ON "user_cosmetic_items"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_cosmetic_items_user_id_cosmetic_item_id_key" ON "user_cosmetic_items"("user_id", "cosmetic_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "points_transactions_user_cosmetic_item_id_key" ON "points_transactions"("user_cosmetic_item_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_equipped_frame_id_fkey" FOREIGN KEY ("equipped_frame_id") REFERENCES "cosmetic_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_equipped_title_id_fkey" FOREIGN KEY ("equipped_title_id") REFERENCES "cosmetic_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_user_cosmetic_item_id_fkey" FOREIGN KEY ("user_cosmetic_item_id") REFERENCES "user_cosmetic_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cosmetic_items" ADD CONSTRAINT "user_cosmetic_items_cosmetic_item_id_fkey" FOREIGN KEY ("cosmetic_item_id") REFERENCES "cosmetic_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

