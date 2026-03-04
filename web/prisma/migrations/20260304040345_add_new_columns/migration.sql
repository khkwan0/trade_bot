/*
  Warnings:

  - Added the required column `user_id` to the `exchanges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `pairs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `telegram` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "exchanges" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "pairs" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "telegram" ADD COLUMN     "user_id" INTEGER NOT NULL;
