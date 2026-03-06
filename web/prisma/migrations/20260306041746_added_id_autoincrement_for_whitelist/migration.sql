/*
  Warnings:

  - You are about to drop the column `exchange_id` on the `pairs` table. All the data in the column will be lost.
  - Added the required column `user_exchange_id` to the `pairs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "pairs" DROP CONSTRAINT "pairs_exchange_id_fkey";

-- AlterTable
ALTER TABLE "pairs" DROP COLUMN "exchange_id",
ADD COLUMN     "user_exchange_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "whitelist" ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "whitelist_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "pairs" ADD CONSTRAINT "pairs_user_exchange_id_fkey" FOREIGN KEY ("user_exchange_id") REFERENCES "user_exchanges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_exchanges" ADD CONSTRAINT "user_exchanges_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
