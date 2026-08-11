import { ocorrenciasPool } from "@/lib/db-ocorrencias"

/**
 * Controle de Ocorrências — indicador do cliente AMYRIS - BARRA BONITA.
 *
 * LEITURA (apenas) do banco do sistema LogFy (tb_ocorrencias / tb_cliente), via
 * pool pg — nunca Prisma, nunca escrita. Réplica EXATA da aba "Controle de
 * Ocorrências" do LogFy: todos os indicadores (inclusive acidentes/pessoas).
 *
 * O cliente vem da env OCORRENCIAS_CLIENTE (default: AMYRIS - BARRA BONITA).
 * Módulo server-only.
 */

const CLIENTE_NOME = process.env.OCORRENCIAS_CLIENTE || "AMYRIS - BARRA BONITA"
const MESES_NOMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export type Item = { rotulo: string; valor: number }

export type OcorrenciaLinha = {
  id: string
  data: string // YYYY-MM-DD
  hora: string
  colaborador: string
  tipo: string
  turno: string
  gps: string
  cliente: string
  negocio: string
  parteCorpo: string
  cat: boolean
  local: string
}

export type OcorrenciasData = {
  mes: string
  mesAtual: string
  meses: string[]
  clienteLabel: string
  kpis: {
    total: number
    totalMes: number
    mesAnterior: number
    variacaoPct: number | null
    comCat: number
    colaboradores: number
  }
  calendario: { dia: number; count: number }[]
  porMes: { mes: string; count: number }[]
  porTurno: Item[]
  porPsif: Item[]
  porClassGps: Item[]
  porClassCliente: Item[]
  porParteCorpo: Item[]
  porNegocio: Item[]
  porTipo: Item[]
  topColaboradores: { nome: string; count: number }[]
  recentes: OcorrenciaLinha[]
  todas: OcorrenciaLinha[]
}

function mesAnteriorDe(mes: string): string {
  const [a, m] = mes.split("-").map(Number)
  const d = new Date(Date.UTC(a, m - 2, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

const LINHA_COLS = `coalesce(nullif(anomalia_sap,''), left(id::text,8)) id,
  to_char(data,'YYYY-MM-DD') "data", coalesce(hora,'—') hora, coalesce(colaborador,'—') colaborador,
  coalesce(nullif(tipo_ocorrencia,''),'—') tipo, coalesce(nullif(turno,''),'—') turno,
  coalesce(nullif(classificacao_gps,''),'—') gps, coalesce(nullif(classificacao_cliente,''),'—') cliente,
  coalesce(nullif(negocios,''),'—') negocio, coalesce(nullif(parte_corpo,''),'—') "parteCorpo",
  (abertura_cat is not null and abertura_cat <> '') cat, coalesce(nullif(local_ocr,''),'—') "local"`

export async function getOcorrenciasData(mesEntrada?: string): Promise<OcorrenciasData> {
  const cliQ = await ocorrenciasPool.query<{ id: string; cliente: string }>(
    "select id, cliente from tb_cliente where cliente = $1 limit 1",
    [CLIENTE_NOME],
  )
  const cliente = cliQ.rows[0]
  if (!cliente) throw new Error(`Cliente "${CLIENTE_NOME}" não encontrado no controle de ocorrências.`)
  const clienteId = cliente.id

  const mesesQ = await ocorrenciasPool.query<{ m: string }>(
    "select distinct to_char(data, 'YYYY-MM') m from tb_ocorrencias where cliente_id = $1 order by m desc",
    [clienteId],
  )
  const mesesDisp = mesesQ.rows.map((r) => r.m)
  const mes =
    mesEntrada && /^\d{4}-\d{2}$/.test(mesEntrada) ? mesEntrada : mesesDisp[0] ?? new Date().toISOString().slice(0, 7)
  const meses = Array.from(new Set([mes, ...mesesDisp])).sort((a, b) => (a < b ? 1 : -1))
  const mesAnt = mesAnteriorDe(mes)

  // Helper de agregação por coluna (só do mês selecionado).
  const grupo = (col: string, filtroNaoNulo = false) =>
    ocorrenciasPool.query<{ rotulo: string; n: string }>(
      `select coalesce(nullif(${col},''),'—') rotulo, count(*)::int n
         from tb_ocorrencias
        where cliente_id = $1 and to_char(data,'YYYY-MM') = $2${filtroNaoNulo ? ` and ${col} is not null and ${col} <> ''` : ""}
        group by 1 order by n desc`,
      [clienteId, mes],
    )

  const [
    totalQ,
    mesQ,
    mesAntQ,
    comCatQ,
    colabQ,
    porTurnoQ,
    porPsifQ,
    porClassGpsQ,
    porClassClienteQ,
    porParteCorpoQ,
    porNegocioQ,
    porTipoQ,
    topColabQ,
    porMesQ,
    calendarioQ,
    recentesQ,
    todasQ,
  ] = await Promise.all([
    ocorrenciasPool.query<{ n: string }>("select count(*)::int n from tb_ocorrencias where cliente_id = $1", [clienteId]),
    ocorrenciasPool.query<{ n: string }>(
      "select count(*)::int n from tb_ocorrencias where cliente_id = $1 and to_char(data,'YYYY-MM') = $2",
      [clienteId, mes],
    ),
    ocorrenciasPool.query<{ n: string }>(
      "select count(*)::int n from tb_ocorrencias where cliente_id = $1 and to_char(data,'YYYY-MM') = $2",
      [clienteId, mesAnt],
    ),
    ocorrenciasPool.query<{ n: string }>(
      "select count(*)::int n from tb_ocorrencias where cliente_id = $1 and to_char(data,'YYYY-MM') = $2 and abertura_cat is not null and abertura_cat <> ''",
      [clienteId, mes],
    ),
    ocorrenciasPool.query<{ n: string }>(
      "select count(distinct colaborador)::int n from tb_ocorrencias where cliente_id = $1 and to_char(data,'YYYY-MM') = $2",
      [clienteId, mes],
    ),
    grupo("turno"),
    grupo("psif", true),
    grupo("classificacao_gps", true),
    grupo("classificacao_cliente", true),
    grupo("parte_corpo", true),
    grupo("negocios"),
    grupo("tipo_ocorrencia"),
    ocorrenciasPool.query<{ nome: string; n: string }>(
      `select coalesce(nullif(colaborador,''),'—') nome, count(*)::int n
         from tb_ocorrencias where cliente_id = $1 and to_char(data,'YYYY-MM') = $2
        group by 1 order by n desc limit 5`,
      [clienteId, mes],
    ),
    ocorrenciasPool.query<{ mm: string; n: string }>(
      "select to_char(data,'MM') mm, count(*)::int n from tb_ocorrencias where cliente_id = $1 and to_char(data,'YYYY') = $2 group by 1",
      [clienteId, mes.slice(0, 4)],
    ),
    ocorrenciasPool.query<{ dia: string; n: string }>(
      "select extract(day from data)::int dia, count(*)::int n from tb_ocorrencias where cliente_id = $1 and to_char(data,'YYYY-MM') = $2 group by 1",
      [clienteId, mes],
    ),
    ocorrenciasPool.query(
      `select ${LINHA_COLS} from tb_ocorrencias where cliente_id = $1 and to_char(data,'YYYY-MM') = $2 order by data desc, hora desc limit 10`,
      [clienteId, mes],
    ),
    ocorrenciasPool.query(
      `select ${LINHA_COLS} from tb_ocorrencias where cliente_id = $1 and to_char(data,'YYYY-MM') = $2 order by data desc, hora desc limit 200`,
      [clienteId, mes],
    ),
  ])

  const totalMes = Number(mesQ.rows[0]?.n ?? 0)
  const mesAnterior = Number(mesAntQ.rows[0]?.n ?? 0)
  const variacaoPct =
    mesAnterior > 0 ? Math.round(((totalMes - mesAnterior) / mesAnterior) * 100) : totalMes > 0 ? 100 : null

  const porMesMap = new Map(porMesQ.rows.map((r) => [Number(r.mm), Number(r.n)]))
  const calMap = new Map(calendarioQ.rows.map((r) => [Number(r.dia), Number(r.n)]))
  const [ano, mmSel] = mes.split("-").map(Number)
  const diasNoMes = new Date(ano, mmSel, 0).getDate()

  const itens = (rows: { rotulo: string; n: string }[]): Item[] =>
    rows.map((r) => ({ rotulo: r.rotulo, valor: Number(r.n) }))
  const linha = (r: Record<string, unknown>): OcorrenciaLinha => ({
    id: String(r.id),
    data: String(r.data),
    hora: String(r.hora),
    colaborador: String(r.colaborador),
    tipo: String(r.tipo),
    turno: String(r.turno),
    gps: String(r.gps),
    cliente: String(r.cliente),
    negocio: String(r.negocio),
    parteCorpo: String(r.parteCorpo),
    cat: Boolean(r.cat),
    local: String(r.local),
  })

  return {
    mes,
    mesAtual: mes,
    meses,
    clienteLabel: cliente.cliente,
    kpis: {
      total: Number(totalQ.rows[0]?.n ?? 0),
      totalMes,
      mesAnterior,
      variacaoPct,
      comCat: Number(comCatQ.rows[0]?.n ?? 0),
      colaboradores: Number(colabQ.rows[0]?.n ?? 0),
    },
    calendario: Array.from({ length: diasNoMes }, (_, i) => ({ dia: i + 1, count: calMap.get(i + 1) ?? 0 })),
    porMes: MESES_NOMES.map((nome, i) => ({ mes: nome, count: porMesMap.get(i + 1) ?? 0 })),
    porTurno: itens(porTurnoQ.rows),
    porPsif: itens(porPsifQ.rows),
    porClassGps: itens(porClassGpsQ.rows),
    porClassCliente: itens(porClassClienteQ.rows),
    porParteCorpo: itens(porParteCorpoQ.rows),
    porNegocio: itens(porNegocioQ.rows),
    porTipo: itens(porTipoQ.rows),
    topColaboradores: topColabQ.rows.map((r) => ({ nome: r.nome, count: Number(r.n) })),
    recentes: recentesQ.rows.map(linha),
    todas: todasQ.rows.map(linha),
  }
}
