-- Rollback partial migration 20260306024144_user_exchanges_table
-- Run this to restore DB to pre-migration state, then: resolve --rolled-back && migrate deploy

-- 1. Drop index added by migration
DROP INDEX IF EXISTS "exchanges_name_key";

-- 2. Drop new table
DROP TABLE IF EXISTS "user_exchanges";

-- 3. Restore columns on exchanges (nullable for existing rows)
ALTER TABLE "exchanges"
  ADD COLUMN IF NOT EXISTS "api_key" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "api_secret" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "user_id" TEXT;

-- 4. Restore original unique index
CREATE UNIQUE INDEX IF NOT EXISTS "exchanges_name_user_id_key" ON "exchanges"("name", "user_id");

-- 5. Restore FK from pairs to exchanges
ALTER TABLE "pairs"
  ADD CONSTRAINT "pairs_exchange_id_fkey"
  FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
