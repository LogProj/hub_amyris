import { Pool } from "pg"

/**
 * Pool de conexão com o banco db_inhaus (Postgres), SEPARADO do DATABASE_URL do
 * hub (db_amyris). Usado só pelo indicador de Headcount, que lê a view
 * public.vw_ponto_amyris. Reaproveitado entre hot-reloads no dev via globalThis.
 * Usado apenas no servidor.
 */
const globalForDb = globalThis as unknown as { inhausPool?: Pool }

// Aceita DATABASE_URL como fallback (ambos apontam para o db_inhaus hoje).
// Sem nenhuma das duas, falha com mensagem clara em vez de tentar 127.0.0.1:5432.
const inhausUrl = process.env.DATABASE_URL_INHAUS || process.env.DATABASE_URL
if (!inhausUrl) {
  throw new Error(
    "Conexão com o db_inhaus não configurada: defina DATABASE_URL_INHAUS (ou DATABASE_URL) nas variáveis de ambiente."
  )
}

export const inhausPool =
  globalForDb.inhausPool ??
  new Pool({
    connectionString: inhausUrl,
    max: 5,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  })

if (process.env.NODE_ENV !== "production") globalForDb.inhausPool = inhausPool
