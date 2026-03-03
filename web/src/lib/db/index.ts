import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// For Next.js HMR in development, use a global variable
const globalForPool = global as unknown as { pool: Pool }
export const db = globalForPool.pool || pool

if (process.env.NODE_ENV !== 'production') globalForPool.pool = db
