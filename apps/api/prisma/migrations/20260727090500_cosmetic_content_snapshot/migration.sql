-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "sender_frame_class_name" TEXT,
ADD COLUMN     "sender_title_name" TEXT,
ADD COLUMN     "sender_title_rarity" "CosmeticRarity";

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "author_frame_class_name" TEXT,
ADD COLUMN     "author_title_name" TEXT,
ADD COLUMN     "author_title_rarity" "CosmeticRarity";

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "author_frame_class_name" TEXT,
ADD COLUMN     "author_title_name" TEXT,
ADD COLUMN     "author_title_rarity" "CosmeticRarity";

