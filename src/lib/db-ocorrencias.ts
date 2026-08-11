import { Pool } from "pg"

/**
 * Pool de conexão com o banco do sistema de Controle de Ocorrências (LogFy),
 * um Postgres SEPARADO do db_inhaus e do db_amyris. Usado somente em LEITURA
 * pelo indicador de Ocorrências (tabelas tb_ocorrencias / tb_cliente).
 *
 * Mesmo padrão do db-inhaus.ts: pool PREGUIÇOSO (criado só na primeira query,
 * nunca no load do módulo) para não exigir a env em tempo de `next build`.
 * Usado apenas no servidor.
 */
const globalForDb = globalThis as unknown as { ocorrenciasPool?: Pool }

function criarPool(): Pool {
  const url = process.env.DATABASE_URL_LOGFY || process.env.DATABASE_URL_OCORRENCIAS
  if (!url) {
    throw new Error(
      "Conexão com o banco de Ocorrências não configurada: defina DATABASE_URL_LOGFY nas variáveis de ambiente.",
    )
  }
  const pool = new Pool({
    connectionString: url,
    max: 5,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  })
  if (process.env.NODE_ENV !== "production") globalForDb.ocorrenciasPool = pool
  return pool
}

function getPool(): Pool {
  return globalForDb.ocorrenciasPool ?? criarPool()
}

// Proxy: só materializa o Pool quando alguma propriedade (ex.: .query) é acessada.
export const ocorrenciasPool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const pool = getPool()
    const value = Reflect.get(pool, prop, receiver)
    return typeof value === "function" ? value.bind(pool) : value
  },
})
