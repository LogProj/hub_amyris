import { inhausPool } from "@/lib/db-inhaus"

/**
 * Leitura do Turnover da Amyris no db_inhaus, a partir das views alimentadas
 * pelo RPA rpa_sra sobre a tabela public.ft_colaboradores_sra_diario (snapshot
 * CONGELADO por dia, chave cpf + data_referencia — cada execução do RPA grava a
 * "foto" daquele dia sem sobrescrever dias anteriores).
 *
 * Fonte oficial do quadro diário (headcount por dia): public.vw_quadro_diario_amyris
 * — view criada para agregar, por data_referencia + descricao_funcao, a
 * quantidade de colaboradores (qtd_colaboradores) e de desligados no snapshot
 * (qtd_demitidos), filtrando cr = '96735 - SP - LOG - AMYRIS - BARRA BONITA'.
 * Somamos qtd_colaboradores entre as funções para obter o headcount total do
 * dia — esse é o "quadro médio do mês" usado na fórmula de turnover.
 *
 * Fonte pessoa-a-pessoa (admissão/demissão/função/situação, usada para a lista
 * de desligados recentes, distribuição de tempo de casa e reconstrução de dias
 * sem snapshot congelado): public.vw_sra_amyris_diario.
 *
 * Desligado = dt_demissao IS NOT NULL (campo fixo da pessoa; "situacao" na view
 * é NORMAL/FÉRIAS/AFASTADO — não indica desligamento, então não é usado para
 * essa regra). Ativo = dt_demissao IS NULL.
 *
 * Como a tabela diária só existe a partir da data em que foi criada, dias
 * anteriores a isso (e qualquer dia sem snapshot congelado em
 * vw_quadro_diario_amyris) caem no fallback de reconstrução por
 * dt_admissao/dt_demissao — ver `quadroAtivoEmDia`.
 */

export type Pessoa = {
  nome: string
  cpf: string
  dtAdmissao: string | null // YYYY-MM-DD
  dtDemissao: string | null // YYYY-MM-DD
  descricaoFuncao: string | null
  situacao: string | null
}

type LinhaBanco = {
  nome: string | null
  cpf: string
  dt_admissao: string | null
  dt_demissao: string | null
  descricao_funcao: string | null
  situacao: string | null
}

/** Meses (YYYY-MM) com snapshot disponível na view oficial de quadro diário, do mais recente para o mais antigo. */
export async function getMesesDisponiveis(): Promise<string[]> {
  const { rows } = await inhausPool.query<{ mes: string }>(
    `select distinct to_char(data, 'YYYY-MM') as mes
       from public.vw_quadro_diario_amyris
      order by mes desc`,
  )
  return rows.map((r) => r.mes)
}

/** Uma linha por pessoa (cpf), usando o snapshot mais recente disponível de cada uma. */
async function getPessoas(): Promise<Pessoa[]> {
  const { rows } = await inhausPool.query<LinhaBanco>(
    `select distinct on (cpf)
            nome, cpf,
            to_char(dt_admissao, 'YYYY-MM-DD') as dt_admissao,
            to_char(dt_demissao, 'YYYY-MM-DD') as dt_demissao,
            descricao_funcao,
            situacao
       from public.vw_sra_amyris_diario
      order by cpf, data_referencia desc`,
  )
  return rows.map((r) => ({
    nome: (r.nome ?? "—").trim(),
    cpf: r.cpf,
    dtAdmissao: r.dt_admissao,
    dtDemissao: r.dt_demissao,
    descricaoFuncao: r.descricao_funcao,
    situacao: r.situacao,
  }))
}

/**
 * Headcount diário congelado (public.vw_quadro_diario_amyris — view oficial de
 * quadro diário criada para este fim), por data_referencia (YYYY-MM-DD) →
 * soma de qtd_colaboradores entre as funções naquele dia. Só existe a partir
 * do dia em que a tabela diária passou a ser alimentada pelo RPA — dias sem
 * entrada aqui usam o fallback de reconstrução.
 */
async function getHeadcountDiarioCongelado(): Promise<Map<string, number>> {
  const { rows } = await inhausPool.query<{ iso: string; ativos: string }>(
    `select to_char(data, 'YYYY-MM-DD') as iso,
            sum(qtd_colaboradores) as ativos
       from public.vw_quadro_diario_amyris
      group by 1`,
  )
  return new Map(rows.map((r) => [r.iso, Number(r.ativos)]))
}

function mesDe(iso: string | null): string | null {
  return iso ? iso.slice(0, 7) : null
}

function ativoEm(p: Pessoa, dataRef: string): boolean {
  if (!p.dtAdmissao || p.dtAdmissao > dataRef) return false
  if (p.dtDemissao && p.dtDemissao <= dataRef) return false
  return true
}

/**
 * Quadro ativo em um dia `iso` (YYYY-MM-DD): usa o headcount CONGELADO
 * (public.vw_sra_amyris_diario) quando existe snapshot daquele dia; caso
 * contrário, reconstrói pela regra dt_admissao <= dia e (dt_demissao IS NULL
 * ou dt_demissao >= dia) — fallback necessário para dias anteriores à
 * existência da tabela diária (ou qualquer dia sem execução do RPA).
 */
function quadroAtivoEmDia(iso: string, congelado: Map<string, number>, pessoas: Pessoa[]): number {
  const valorCongelado = congelado.get(iso)
  if (valorCongelado != null) return valorCongelado
  return pessoas.filter((p) => ativoEm(p, iso)).length
}

/**
 * Dias (YYYY-MM-DD) do mês `mes`, do dia 1 até o fim do mês — ou até `hojeIso`
 * quando o mês selecionado é o mês corrente (dias futuros não entram na média).
 */
function diasDoMesAteHoje(mes: string, hojeIso: string): string[] {
  const [anoStr, mesStr] = mes.split("-")
  const ano = Number(anoStr)
  const mesNum = Number(mesStr)
  const totalDias = new Date(ano, mesNum, 0).getDate()
  const dias: string[] = []
  for (let d = 1; d <= totalDias; d++) {
    const iso = `${anoStr}-${mesStr}-${String(d).padStart(2, "0")}`
    if (iso > hojeIso) break
    dias.push(iso)
  }
  return dias
}

/**
 * Número médio de colaboradores ativos no mês = média dos headcounts diários
 * (congelados quando disponíveis, reconstruídos por dt_admissao/dt_demissao
 * quando não) — dias futuros do mês corrente ficam de fora.
 */
function quadroMedioDoMes(
  mes: string,
  hojeIso: string,
  congelado: Map<string, number>,
  pessoas: Pessoa[],
): number {
  const dias = diasDoMesAteHoje(mes, hojeIso)
  if (dias.length === 0) return 0
  const soma = dias.reduce((acc, iso) => acc + quadroAtivoEmDia(iso, congelado, pessoas), 0)
  return soma / dias.length
}

export type TurnoverKpis = {
  quadroAtivoAtual: number
  admissoesMes: number
  desligamentosMes: number
  /**
   * Taxa de turnover mensal = (desligados no mês / número médio de
   * colaboradores ativos no mês) × 100. O quadro médio é a média dos
   * headcounts diários do mês (congelados via public.vw_sra_amyris_diario,
   * com fallback de reconstrução por dt_admissao/dt_demissao para dias sem
   * snapshot) — ver `quadroMedioDoMes`. Resultado em % (0 quando não há
   * quadro para dividir).
   */
  taxaTurnoverPct: number
}

export type PontoMensal = {
  mes: string // YYYY-MM
  label: string // MM/AA
  admissoes: number
  desligamentos: number
  taxaTurnoverPct: number
}

export type PontoHeadcountDiario = {
  iso: string // YYYY-MM-DD
  dia: string // DD
  label: string // DD/MM
  ativos: number
  congelado: boolean // true = veio do snapshot diário; false = reconstruído
}

export type FaixaTempoCasa = {
  faixa: string
  quantidade: number
}

export type Desligado = {
  nome: string
  funcao: string | null
  dtAdmissao: string
  dtDemissao: string
  tempoCasa: string
}

export type TurnoverData = {
  meses: string[]
  mesAtual: string
  kpis: TurnoverKpis
  serieMensal: PontoMensal[]
  headcountDiario: PontoHeadcountDiario[]
  tempoCasa: FaixaTempoCasa[]
  desligadosRecentes: Desligado[]
}

function labelMes(mes: string): string {
  const [ano, m] = mes.split("-")
  return `${m}/${ano.slice(2)}`
}

/** Lista contígua de meses (YYYY-MM), do mais antigo ao mais recente, entre `de` e `ate` (inclusive). */
function mesesEntre(de: string, ate: string): string[] {
  const out: string[] = []
  let [ano, mes] = de.split("-").map(Number)
  const [anoFim, mesFim] = ate.split("-").map(Number)
  while (ano < anoFim || (ano === anoFim && mes <= mesFim)) {
    out.push(`${ano}-${String(mes).padStart(2, "0")}`)
    mes += 1
    if (mes > 12) {
      mes = 1
      ano += 1
    }
  }
  return out
}

function tempoCasaTexto(dtAdmissao: string, dataRef: string): string {
  const inicio = new Date(dtAdmissao)
  const fim = new Date(dataRef)
  let meses = (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth())
  if (fim.getDate() < inicio.getDate()) meses -= 1
  meses = Math.max(0, meses)
  if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`
  const anos = Math.floor(meses / 12)
  const resto = meses % 12
  return resto === 0
    ? `${anos} ${anos === 1 ? "ano" : "anos"}`
    : `${anos}a ${resto}m`
}

function faixaTempoCasa(dtAdmissao: string, dataRef: string): string {
  const inicio = new Date(dtAdmissao)
  const fim = new Date(dataRef)
  const meses = (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth())
  if (meses < 3) return "< 3 meses"
  if (meses < 6) return "3–6 meses"
  if (meses < 12) return "6–12 meses"
  if (meses < 24) return "1–2 anos"
  return "2+ anos"
}

const ORDEM_FAIXAS = ["< 3 meses", "3–6 meses", "6–12 meses", "1–2 anos", "2+ anos"]

export async function getTurnoverData(mesSelecionado?: string): Promise<TurnoverData> {
  const [meses, pessoas, congelado] = await Promise.all([
    getMesesDisponiveis(),
    getPessoas(),
    getHeadcountDiarioCongelado(),
  ])

  const hojeIso = new Date().toISOString().slice(0, 10)
  const mesAtualCalendario = hojeIso.slice(0, 7)

  const mes =
    mesSelecionado && meses.includes(mesSelecionado) ? mesSelecionado : meses[0] ?? mesAtualCalendario

  // --- KPIs ---
  const quadroAtivoAtual = pessoas.filter((p) => ativoEm(p, hojeIso)).length

  const admissoesMes = pessoas.filter((p) => mesDe(p.dtAdmissao) === mes).length
  const desligamentosMes = pessoas.filter((p) => mesDe(p.dtDemissao) === mes).length

  // Taxa de turnover mensal = desligados no mês / quadro médio do mês × 100.
  // Quadro médio = média dos headcounts diários (congelados, com fallback de
  // reconstrução) — ver `quadroMedioDoMes`.
  const quadroMedioMes = quadroMedioDoMes(mes, hojeIso, congelado, pessoas)

  const taxaTurnoverPct =
    quadroMedioMes > 0
      ? Math.round(((desligamentosMes / quadroMedioMes) * 100 + Number.EPSILON) * 10) / 10
      : 0

  // --- Headcount por dia (mês selecionado) ---
  const diasMesSelecionado = diasDoMesAteHoje(mes, hojeIso)
  const headcountDiario: PontoHeadcountDiario[] = diasMesSelecionado.map((iso) => {
    const dia = iso.slice(8, 10)
    const mesLbl = iso.slice(5, 7)
    return {
      iso,
      dia,
      label: `${dia}/${mesLbl}`,
      ativos: quadroAtivoEmDia(iso, congelado, pessoas),
      congelado: congelado.has(iso),
    }
  })

  // --- Série mensal (últimos 12 meses corridos, ou desde a primeira admissão se for mais recente) ---
  const primeiraAdmissao = pessoas
    .map((p) => p.dtAdmissao)
    .filter((d): d is string => !!d)
    .sort()[0]
  const doze = new Date(hojeIso)
  doze.setMonth(doze.getMonth() - 11)
  const inicioJanela = doze.toISOString().slice(0, 7)
  const mesInicioSerie =
    primeiraAdmissao && mesDe(primeiraAdmissao)! > inicioJanela ? mesDe(primeiraAdmissao)! : inicioJanela

  const meseSerie = mesesEntre(mesInicioSerie, mesAtualCalendario)
  const serieMensal: PontoMensal[] = meseSerie.map((m) => {
    const adm = pessoas.filter((p) => mesDe(p.dtAdmissao) === m).length
    const desl = pessoas.filter((p) => mesDe(p.dtDemissao) === m).length
    const qMedio = quadroMedioDoMes(m, hojeIso, congelado, pessoas)
    const taxa = qMedio > 0 ? Math.round(((desl / qMedio) * 100 + Number.EPSILON) * 10) / 10 : 0
    return { mes: m, label: labelMes(m), admissoes: adm, desligamentos: desl, taxaTurnoverPct: taxa }
  })

  // --- Tempo de casa (distribuição dos ativos hoje) ---
  const ativos = pessoas.filter((p) => ativoEm(p, hojeIso) && p.dtAdmissao)
  const contagem = new Map<string, number>(ORDEM_FAIXAS.map((f) => [f, 0]))
  for (const p of ativos) {
    const f = faixaTempoCasa(p.dtAdmissao as string, hojeIso)
    contagem.set(f, (contagem.get(f) ?? 0) + 1)
  }
  const tempoCasa: FaixaTempoCasa[] = ORDEM_FAIXAS.map((f) => ({ faixa: f, quantidade: contagem.get(f) ?? 0 }))

  // --- Desligados recentes ---
  const desligadosRecentes: Desligado[] = pessoas
    .filter((p) => p.dtDemissao && p.dtAdmissao)
    .sort((a, b) => (b.dtDemissao as string).localeCompare(a.dtDemissao as string))
    .slice(0, 20)
    .map((p) => ({
      nome: p.nome,
      funcao: p.descricaoFuncao,
      dtAdmissao: p.dtAdmissao as string,
      dtDemissao: p.dtDemissao as string,
      tempoCasa: tempoCasaTexto(p.dtAdmissao as string, p.dtDemissao as string),
    }))

  return {
    meses,
    mesAtual: mes,
    kpis: { quadroAtivoAtual, admissoesMes, desligamentosMes, taxaTurnoverPct },
    serieMensal,
    headcountDiario,
    tempoCasa,
    desligadosRecentes,
  }
}
