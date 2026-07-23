import { Pool } from "pg"

/**
 * Pool de conexão com o banco db_inhaus (Postgres), SEPARADO do DATABASE_URL do
 * hub (db_amyris). Usado só pelo indicador de Headcount, que lê a view
 * public.vw_ponto_amyris. Reaproveitado entre hot-reloads no dev via globalThis.
 * Usado apenas no servidor.
 */
const globalForDb = globalThis as unknown as { inhausPool?: Pool }

export const inhausPool =
  globalForDb.inhausPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL_INHAUS,
    max: 5,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  })

if (process.env.NODE_ENV !== "production") globalForDb.inhausPool = inhausPool
