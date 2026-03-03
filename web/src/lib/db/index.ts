import { sql } from "bun"

// In development, Next.js hot-reloading can create multiple pools.
// We attach the pool to the global object to keep it persistent.
const globalForSql = globalThis as unknown as { sql: typeof sql }

export const db = globalForSql.sql || sql

if (process.env.NODE_ENV !== "production") globalForSql.sql = db
