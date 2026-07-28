-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "sender_font_class_name" TEXT;

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "author_font_class_name" TEXT;

-- AlterTable
ALTER TABLE "cosmetic_items" ADD COLUMN     "emoji" TEXT;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "author_font_class_name" TEXT;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "equipped_font_id" TEXT,
ADD COLUMN     "equipped_mascot_id" TEXT;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_equipped_font_id_fkey" FOREIGN KEY ("equipped_font_id") REFERENCES "cosmetic_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_equipped_mascot_id_fkey" FOREIGN KEY ("equipped_mascot_id") REFERENCES "cosmetic_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
