// Aplica um arquivo .sql no DATABASE_URL (db_inhaus COMPARTILHADO).
// ALLOW-LIST: só roda o arquivo se TODA instrução nele for uma das permitidas abaixo.
// Qualquer outra coisa (view/function, grant/revoke, update em tabela alheia, insert
// fora do padrão "on conflict do nothing" etc.) é recusada, com o arquivo INTEIRO
// rejeitado sem conectar no banco. Uso: node scripts/aplicar-sql.mjs <arquivo.sql>
import fs from "node:fs"
import pg from "pg"

const arquivo = process.argv[2]
if (!arquivo) {
  console.error("Uso: node scripts/aplicar-sql.mjs <arquivo.sql>")
  process.exit(1)
}

const sql = fs.readFileSync(arquivo, "utf8")

// Remove comentários de linha (--) e divide em instruções por ";".
// Por que o split ingênuo por ";" é seguro mesmo sem entender SQL de verdade: ele
// SUPER-divide (por exemplo, um ";" dentro de uma string quebraria em pedaços que
// isoladamente não são frases completas). Um pedaço torto assim não bate com
// nenhum regex da allow-list, então o arquivo INTEIRO é rejeitado antes de
// conectar no banco — ele falha fechado, nunca aberto. NÃO "consertar" isso para
// um parser mais esperto sem manter essa propriedade. Comentários em bloco
// (/* ... */) não são removidos por este código — se aparecerem, o conteúdo
// dentro deles também não vai bater com a allow-list e o arquivo será rejeitado.
function dividirEmInstrucoes(texto) {
  const semComentarios = texto
    .split("\n")
    .map((linha) => {
      const i = linha.indexOf("--")
      return i === -1 ? linha : linha.slice(0, i)
    })
    .join("\n")
  return semComentarios
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

const PERMITIDAS = [
  /^begin$/i,
  /^commit$/i,
  /^create\s+table\s+if\s+not\s+exists\s+/i,
  /^create\s+index\s+if\s+not\s+exists\s+/i,
  /^insert\s+into\s+.+\son\s+conflict\s+.+\sdo\s+nothing$/is,
]

const instrucoes = dividirEmInstrucoes(sql)
for (const instrucao of instrucoes) {
  const ok = PERMITIDAS.some((re) => re.test(instrucao))
  if (!ok) {
    console.error("Recusado: instrução não permitida pela allow-list:")
    console.error(instrucao)
    process.exit(1)
  }
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
