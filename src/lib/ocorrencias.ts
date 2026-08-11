import { ocorrenciasPool } from "@/lib/db-ocorrencias"

/**
 * Controle de Ocorrências — indicador do cliente AMYRIS - BARRA BONITA.
 *
 * LEITURA (apenas) do banco do sistema LogFy (tabelas tb_ocorrencias / tb_cliente),
 * via pool pg — nunca Prisma, nunca escrita. Mesmo padrão do epi.ts / turnover.ts.
 *
 * RESTRITO a ocorrências que NÃO envolvem pessoas — sem acidentes/lesões. Só entram
 * as classificações materiais e comportamentais/ambientais (ver GPS_SEM_PESSOA).
 *
 * O cliente vem da env OCORRENCIAS_CLIENTE (default: AMYRIS - BARRA BONITA).
 * Módulo server-only.
 */

const CLIENTE_NOME = process.env.OCORRENCIAS_CLIENTE || "AMYRIS - BARRA BONITA"

// Classificações (classificacao_gps) que NÃO envolvem pessoa — as únicas exibidas.
const GPS_SEM_PESSOA = ["Incidente Material", "Ato Inseguro", "Condição Insegura"]

const MESES_NOMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export type OcorrenciaLinha = {
  id: string
  data: string // YYYY-MM-DD
  hora: string
  colaborador: string
  tipo: string
  turno: string
  gps: string
  negocio: string
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
    condicoesInseguras: number
    atosInseguros: number
  }
  calendario: { dia: number; count: number }[]
  porMes: { mes: string; count: number }[]
  porTurno: { turno: string; count: number }[]
  porClassificacao: { classificacao: string; count: number }[]
  porTipo: { tipo: string; count: number }[]
  porNegocio: { negocio: string; count: number }[]
  recentes: OcorrenciaLinha[]
}

function mesAnteriorDe(mes: string): string {
  const [a, m] = mes.split("-").map(Number)
  const d = new Date(Date.UTC(a, m - 2, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

export async function getOcorrenciasData(mesEntrada?: string): Promise<OcorrenciasData> {
  // Resolve o cliente pelo nome (linha em tb_cliente).
  const cliQ = await ocorrenciasPool.query<{ id: string; cliente: string }>(
    "select id, cliente from tb_cliente where cliente = $1 limit 1",
    [CLIENTE_NOME],
  )
  const cliente = cliQ.rows[0]
  if (!cliente) {
    throw new Error(`Cliente "${CLIENTE_NOME}" não encontrado no controle de ocorrências.`)
  }
  const clienteId = cliente.id

  // Filtro comum: cliente + só classificações sem pessoa.
  const base = "cliente_id = $1 and classificacao_gps = any($2)"
  const paramsBase = [clienteId, GPS_SEM_PESSOA]

  // Meses disponíveis (com ocorrências sem pessoa).
  const mesesQ = await ocorrenciasPool.query<{ m: string }>(
    `select distinct to_char(data, 'YYYY-MM') m from tb_ocorrencias where ${base} order by m desc`,
    paramsBase,
  )
  const mesesDisp = mesesQ.rows.map((r) => r.m)
  const mes =
    mesEntrada && /^\d{4}-\d{2}$/.test(mesEntrada) ? mesEntrada : mesesDisp[0] ?? new Date().toISOString().slice(0, 7)
  const meses = Array.from(new Set([mes, ...mesesDisp])).sort((a, b) => (a < b ? 1 : -1))
  const mesAnt = mesAnteriorDe(mes)

  const [
    totalQ,
    mesQ,
    mesAntQ,
    condicoesQ,
    atosQ,
    porTurnoQ,
    porClassQ,
    porTipoQ,
    porNegocioQ,
    porMesQ,
    calendarioQ,
    recentesQ,
  ] = await Promise.all([
    ocorrenciasPool.query<{ n: string }>(`select count(*)::int n from tb_ocorrencias where ${base}`, paramsBase),
    ocorrenciasPool.query<{ n: string }>(
      `select count(*)::int n from tb_ocorrencias where ${base} and to_char(data,'YYYY-MM') = $3`,
      [...paramsBase, mes],
    ),
    ocorrenciasPool.query<{ n: string }>(
      `select count(*)::int n from tb_ocorrencias where ${base} and to_char(data,'YYYY-MM') = $3`,
      [...paramsBase, mesAnt],
    ),
    ocorrenciasPool.query<{ n: string }>(
      `select count(*)::int n from tb_ocorrencias where cliente_id = $1 and classificacao_gps = 'Condição Insegura' and to_char(data,'YYYY-MM') = $2`,
      [clienteId, mes],
    ),
    ocorrenciasPool.query<{ n: string }>(
      `select count(*)::int n from tb_ocorrencias where cliente_id = $1 and classificacao_gps = 'Ato Inseguro' and to_char(data,'YYYY-MM') = $2`,
      [clienteId, mes],
    ),
    ocorrenciasPool.query<{ turno: string; n: string }>(
      `select coalesce(nullif(turno,''),'—') turno, count(*)::int n from tb_ocorrencias where ${base} and to_char(data,'YYYY-MM') = $3 group by 1 order by n desc`,
      [...paramsBase, mes],
    ),
    ocorrenciasPool.query<{ classificacao: string; n: string }>(
      `select classificacao_gps classificacao, count(*)::int n from tb_ocorrencias where ${base} and to_char(data,'YYYY-MM') = $3 group by 1 order by n desc`,
      [...paramsBase, mes],
    ),
    ocorrenciasPool.query<{ tipo: string; n: string }>(
      `select coalesce(nullif(tipo_ocorrencia,''),'—') tipo, count(*)::int n from tb_ocorrencias where ${base} and to_char(data,'YYYY-MM') = $3 group by 1 order by n desc limit 8`,
      [...paramsBase, mes],
    ),
    ocorrenciasPool.query<{ negocio: string; n: string }>(
      `select coalesce(nullif(negocios,''),'—') negocio, count(*)::int n from tb_ocorrencias where ${base} and to_char(data,'YYYY-MM') = $3 group by 1 order by n desc limit 8`,
      [...paramsBase, mes],
    ),
    ocorrenciasPool.query<{ mm: string; n: string }>(
      `select to_char(data,'MM') mm, count(*)::int n from tb_ocorrencias where ${base} and to_char(data,'YYYY') = $3 group by 1`,
      [...paramsBase, mes.slice(0, 4)],
    ),
    ocorrenciasPool.query<{ dia: string; n: string }>(
      `select extract(day from data)::int dia, count(*)::int n from tb_ocorrencias where ${base} and to_char(data,'YYYY-MM') = $3 group by 1`,
      [...paramsBase, mes],
    ),
    ocorrenciasPool.query<{
      id: string
      data: string
      hora: string | null
      colaborador: string | null
      tipo: string | null
      turno: string | null
      gps: string | null
      negocio: string | null
      local: string | null
    }>(
      `select coalesce(nullif(anomalia_sap,''), left(id::text,8)) id,
              to_char(data,'YYYY-MM-DD') "data", hora, colaborador,
              tipo_ocorrencia tipo, turno, classificacao_gps gps,
              negocios negocio, local_ocr "local"
         from tb_ocorrencias
        where ${base} and to_char(data,'YYYY-MM') = $3
        order by data desc, hora desc
        limit 50`,
      [...paramsBase, mes],
    ),
  ])

  const totalMes = Number(mesQ.rows[0]?.n ?? 0)
  const mesAnterior = Number(mesAntQ.rows[0]?.n ?? 0)
  const variacaoPct =
    mesAnterior > 0
      ? Math.round(((totalMes - mesAnterior) / mesAnterior) * 100)
      : totalMes > 0
        ? 100
        : null

  const porMesMap = new Map(porMesQ.rows.map((r) => [Number(r.mm), Number(r.n)]))
  const calMap = new Map(calendarioQ.rows.map((r) => [Number(r.dia), Number(r.n)]))
  const [ano, mm] = mes.split("-").map(Number)
  const diasNoMes = new Date(ano, mm, 0).getDate()

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
      condicoesInseguras: Number(condicoesQ.rows[0]?.n ?? 0),
      atosInseguros: Number(atosQ.rows[0]?.n ?? 0),
    },
    calendario: Array.from({ length: diasNoMes }, (_, i) => ({ dia: i + 1, count: calMap.get(i + 1) ?? 0 })),
    porMes: MESES_NOMES.map((nome, i) => ({ mes: nome, count: porMesMap.get(i + 1) ?? 0 })),
    porTurno: porTurnoQ.rows.map((r) => ({ turno: r.turno, count: Number(r.n) })),
    porClassificacao: porClassQ.rows.map((r) => ({ classificacao: r.classificacao, count: Number(r.n) })),
    porTipo: porTipoQ.rows.map((r) => ({ tipo: r.tipo, count: Number(r.n) })),
    porNegocio: porNegocioQ.rows.map((r) => ({ negocio: r.negocio, count: Number(r.n) })),
    recentes: recentesQ.rows.map((r) => ({
      id: r.id,
      data: r.data,
      hora: r.hora ?? "—",
      colaborador: r.colaborador ?? "—",
      tipo: r.tipo ?? "—",
      turno: r.turno ?? "—",
      gps: r.gps ?? "—",
      negocio: r.negocio ?? "—",
      local: r.local ?? "—",
    })),
  }
}
