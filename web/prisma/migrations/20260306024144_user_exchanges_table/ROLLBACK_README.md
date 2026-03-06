# Option B: Roll back and re-run migration

Run these in order (with DATABASE_URL set, e.g. from `.env`):

```bash
cd web

# 1. Restore DB to pre-migration state
npx prisma db execute --file prisma/migrations/20260306024144_user_exchanges_table/rollback.sql

# 2. Mark the failed migration as rolled back
npx prisma migrate resolve --rolled-back 20260306024144_user_exchanges_table

# 3. Re-apply the migration (includes data migration)
npx prisma migrate deploy
```

For `migrate dev` instead of `deploy`:

```bash
npx prisma migrate dev
```
