-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "equipped_banner_id" TEXT,
ADD COLUMN     "equipped_effect_id" TEXT;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_equipped_banner_id_fkey" FOREIGN KEY ("equipped_banner_id") REFERENCES "cosmetic_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_equipped_effect_id_fkey" FOREIGN KEY ("equipped_effect_id") REFERENCES "cosmetic_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
