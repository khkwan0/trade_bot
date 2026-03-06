/*
  Warnings:

  - You are about to drop the column `api_key` on the `exchanges` table. All the data in the column will be lost.
  - You are about to drop the column `api_secret` on the `exchanges` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `exchanges` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `exchanges` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "pairs" DROP CONSTRAINT "pairs_exchange_id_fkey";

-- DropIndex
DROP INDEX "exchanges_name_user_id_key";

-- AlterTable
ALTER TABLE "exchanges" DROP COLUMN "api_key",
DROP COLUMN "api_secret",
DROP COLUMN "user_id";

-- CreateTable
CREATE TABLE "user_exchanges" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "exchange_id" INTEGER NOT NULL,
    "api_key" VARCHAR(255),
    "api_secret" VARCHAR(255),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_exchanges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_exchanges_exchange_id_user_id_key" ON "user_exchanges"("exchange_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "exchanges_name_key" ON "exchanges"("name");

-- Data migration: pairs.exchange_id currently references exchanges.id; it must reference user_exchanges.id.
-- Create one user_exchanges row per (user_id, exchange_id) that exists in pairs, then point pairs at those rows.
INSERT INTO "user_exchanges" ("user_id", "exchange_id")
SELECT DISTINCT "user_id", "exchange_id" FROM "pairs";

UPDATE "pairs" p
SET "exchange_id" = ue."id"
FROM "user_exchanges" ue
WHERE ue."user_id" = p."user_id" AND ue."exchange_id" = p."exchange_id";

-- AddForeignKey
ALTER TABLE "pairs" ADD CONSTRAINT "pairs_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "user_exchanges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
