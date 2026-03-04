-- AlterTable: change user_id from INTEGER to TEXT (User.id is cuid string)
ALTER TABLE "telegram" ALTER COLUMN "user_id" SET DATA TYPE TEXT USING user_id::text;

-- Remove rows whose user_id does not match any User.id (old integer values become '1','2', etc.)
DELETE FROM "telegram" WHERE "user_id" NOT IN (SELECT id FROM "User");

-- AddForeignKey
ALTER TABLE "telegram" ADD CONSTRAINT "telegram_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
