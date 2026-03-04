-- AlterTable: make url optional
ALTER TABLE "exchanges" ALTER COLUMN "url" DROP NOT NULL;

-- CreateIndex: unique (name, user_id) per user
CREATE UNIQUE INDEX "exchanges_name_user_id_key" ON "exchanges"("name", "user_id");
