// Aplica um arquivo .sql no DATABASE_URL (db_inhaus COMPARTILHADO).
// Recusa qualquer arquivo com comandos destrutivos. Uso: node scripts/aplicar-sql.mjs <arquivo.sql>
import fs from "node:fs"
import pg from "pg"

const arquivo = process.argv[2]
if (!arquivo) {
  console.error("Uso: node scripts/aplicar-sql.mjs <arquivo.sql>")
  process.exit(1)
}

const sql = fs.readFileSync(arquivo, "utf8")
if (/\b(drop|truncate|alter)\b|\bdelete\s+from\b/i.test(sql)) {
  console.error("Recusado: o arquivo contém DROP/TRUNCATE/ALTER/DELETE FROM.")
  process.exit(1)
}

function lerEnvLocal() {
  if (!fs.existsSync(".env.local")) return {}
  return Object.fromEntries(
    fs
      .readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => {
        const i = l.indexOf("=")
        return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]
      }),
  )
}

const url = process.env.DATABASE_URL || lerEnvLocal().DATABASE_URL
if (!url) {
  console.error("DATABASE_URL não definido (.env.local ou ambiente).")
  process.exit(1)
}

const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  await client.query(sql)
  console.log("OK:", arquivo)
} finally {
  await client.end()
}
