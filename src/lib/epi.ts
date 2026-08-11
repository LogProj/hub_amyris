import { inhausPool } from "@/lib/db-inhaus"

/**
 * Acompanhamento de UTILIZAÇÃO DE EPIs — leitura do db_inhaus (tabelas epi_*),
 * escopada a UM CR (o CR da AMYRIS, por padrão). Espelha o indicador do hub_inhaus,
 * mas aqui é APENAS LEITURA via pool pg (nunca Prisma, nunca escrita) — o mesmo
 * padrão do turnover.ts.
 *
 * O CR vem da env `EPI_CR_FIXO` (default: o CR da AMYRIS - Barra Bonita).
 * Módulo server-only.
 */

const CR_FIXO = process.env.EPI_CR_FIXO || "96735 - SP - LOG - AMYRIS - BARRA BONITA"

export type EpiData = {
  mes: string
  mesAtual: string
  meses: string[]
  crLabel: string
  kpis: {
    aderencia: number
    esperados: number
    preenchidos: number
    naoConformidades: number
    ausencias: number
    diasPendentes: number
  }
  porDia: { dia: string; aderencia: number }[]
  conformidade: { conformes: number; naoConformes: number }
  naoConformidades: { nome: string; epis: string[]; data: string }[]
  ausencias: { nome: string; data: string }[]
  pendencias: { turno: string; dias: string[] }[]
}

function hojeIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function diaSemana(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay()
}

function diasDoMes(mes: string): string[] {
  const [a, m] = mes.split("-").map(Number)
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate()
  return Array.from({ length: ultimo }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`)
}

type ItemResposta = { epiId?: string; itemId?: string; epi?: string; rotulo?: string; conforme?: boolean }

export async function getEpiData(mesEntrada?: string): Promise<EpiData> {
  const hoje = hojeIso()
  const mes = mesEntrada && /^\d{4}-\d{2}$/.test(mesEntrada) ? mesEntrada : hoje.slice(0, 7)
  const dias = diasDoMes(mes).filter((d) => d <= hoje)
  const primeiro = `${mes}-01`
  const ultimo = diasDoMes(mes).at(-1) as string

  const [turnosQ, alocQ, respQ, grupoQ, mesesQ] = await Promise.all([
    inhausPool.query<{ id: number; nome: string; dias_semana: number[] }>(
      "select id, nome, dias_semana from epi_turno where cr = $1 and ativo = true",
      [CR_FIXO],
    ),
    inhausPool.query<{ turno_id: number; n: number }>(
      "select turno_id, count(*)::int n from epi_atribuicao_turno where cr = $1 and fim_em is null group by turno_id",
      [CR_FIXO],
    ),
    inhausPool.query<{
      turno_id: number
      dia: string
      cpf_hash: string | null
      nome: string | null
      ausente: boolean | null
      conforme: boolean | null
      respostas: ItemResposta[] | null
    }>(
      `select s.turno_id, s.data::text dia, r.cpf_hash, r.nome, r.ausente, r.conforme, r.respostas
         from epi_sessao_turno s
         left join epi_resposta r on r.sessao_id = s.id
        where s.turno_id in (select id from epi_turno where cr = $1 and ativo = true)
          and s.data >= $2::date and s.data <= $3::date`,
      [CR_FIXO, primeiro, ultimo],
    ),
    inhausPool.query<{ nome_grp_cliente: string | null }>(
      "select nome_grp_cliente from dm_cr where cr = lpad(split_part(btrim($1),' - ',1),5,'0') limit 1",
      [CR_FIXO],
    ),
    inhausPool.query<{ m: string }>(
      `select distinct to_char(s.data,'YYYY-MM') m
         from epi_sessao_turno s
        where s.turno_id in (select id from epi_turno where cr = $1 and ativo = true)
        order by m desc`,
      [CR_FIXO],
    ),
  ])

  const meses = Array.from(new Set([mes, hoje.slice(0, 7), ...mesesQ.rows.map((r) => r.m)])).sort((a, b) =>
    a < b ? 1 : -1,
  )

  const turnos = turnosQ.rows
  const alocPorTurno = new Map(alocQ.rows.map((r) => [r.turno_id, r.n]))
  const nomeTurno = new Map(turnos.map((t) => [t.id, t.nome]))

  // sessões existentes por turno+dia e respostas por sessão(dia+turno)
  const sessaoDias = new Set<string>() // `${turnoId}|${dia}`
  const respostas: {
    turnoId: number
    dia: string
    nome: string
    ausente: boolean
    conforme: boolean
    itens: ItemResposta[]
  }[] = []
  for (const row of respQ.rows) {
    sessaoDias.add(`${row.turno_id}|${row.dia}`)
    if (row.cpf_hash) {
      respostas.push({
        turnoId: row.turno_id,
        dia: row.dia,
        nome: row.nome ?? "—",
        ausente: row.ausente ?? false,
        conforme: row.conforme ?? false,
        itens: Array.isArray(row.respostas) ? row.respostas : [],
      })
    }
  }

  // agregados
  let esperados = 0
  let preenchidos = 0
  let ausencias = 0
  let naoConformesN = 0
  const porDiaMap = new Map<string, { esperados: number; preenchidos: number }>()
  const naoConformidades: { nome: string; epis: string[]; data: string }[] = []
  const listaAusencias: { nome: string; data: string }[] = []
  const pendPorTurno = new Map<number, string[]>()

  for (const t of turnos) {
    const aloc = alocPorTurno.get(t.id) ?? 0
    const diasEsperados = dias.filter((d) => t.dias_semana.includes(diaSemana(d)))
    for (const d of diasEsperados) {
      esperados += aloc
      const acc = porDiaMap.get(d) ?? { esperados: 0, preenchidos: 0 }
      acc.esperados += aloc
      porDiaMap.set(d, acc)
      if (!sessaoDias.has(`${t.id}|${d}`) && aloc > 0) {
        const arr = pendPorTurno.get(t.id) ?? []
        arr.push(d)
        pendPorTurno.set(t.id, arr)
      }
    }
  }

  for (const r of respostas) {
    if (r.ausente) {
      ausencias += 1
      listaAusencias.push({ nome: r.nome, data: r.dia })
      continue
    }
    preenchidos += 1
    const acc = porDiaMap.get(r.dia)
    if (acc) acc.preenchidos += 1
    if (!r.conforme) {
      naoConformesN += 1
      const epis = r.itens
        .filter((i) => i.conforme === false)
        .map((i) => i.epi || i.rotulo || i.epiId || i.itemId || "EPI")
      naoConformidades.push({ nome: r.nome, epis, data: r.dia })
    }
  }

  const pct = (p: number, e: number) => (e > 0 ? Math.round((p / e) * 100) : 0)
  const porDia = dias
    .filter((d) => (porDiaMap.get(d)?.esperados ?? 0) > 0)
    .map((d) => {
      const a = porDiaMap.get(d)!
      return { dia: d, aderencia: pct(a.preenchidos, a.esperados) }
    })

  const pendencias = Array.from(pendPorTurno.entries()).map(([turnoId, ds]) => ({
    turno: nomeTurno.get(turnoId) ?? `Turno ${turnoId}`,
    dias: ds,
  }))
  const diasPendentes = pendencias.reduce((n, p) => n + p.dias.length, 0)

  naoConformidades.sort((a, b) => (a.data < b.data ? 1 : -1))
  listaAusencias.sort((a, b) => (a.data < b.data ? 1 : -1))

  return {
    mes,
    mesAtual: mes,
    meses,
    crLabel: grupoQ.rows[0]?.nome_grp_cliente || CR_FIXO,
    kpis: {
      aderencia: pct(preenchidos, esperados),
      esperados,
      preenchidos,
      naoConformidades: naoConformesN,
      ausencias,
      diasPendentes,
    },
    porDia,
    conformidade: { conformes: Math.max(0, preenchidos - naoConformesN), naoConformes: naoConformesN },
    naoConformidades,
    ausencias: listaAusencias,
    pendencias,
  }
}
