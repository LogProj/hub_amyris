// Regras de negócio do Checklist de Carregamento. Funções PURAS (sem I/O), usadas
// no cliente (feedback imediato) e no servidor (fonte da verdade no POST).

export const EPIS = [
  { codigo: "luva", nome: "Luva" },
  { codigo: "bota", nome: "Bota" },
  { codigo: "capacete", nome: "Capacete" },
  { codigo: "oculos", nome: "Óculos" },
  { codigo: "auricular", nome: "Protetor auricular" },
  { codigo: "cinto", nome: "Cinto" },
  { codigo: "talabarte", nome: "Talabarte" },
] as const

export type EpiCodigo = (typeof EPIS)[number]["codigo"]
export type EpiStatus = "sim" | "na" | "nao"
const EPI_STATUS: readonly EpiStatus[] = ["sim", "na", "nao"]

export const MAX_LACRES = 4
export const FUNCAO_SUPERVISOR = "SUPERVISOR DE LOGISTICA"
export const FUNCAO_LIDER = "OPERADOR LOGISTICO LIDER"

export type PessoaSra = { id: string; nome: string; funcao: string | null }
export type PessoaSraServidor = PessoaSra & { cpf: string }

export type ChecklistPayload = {
  operadores: string[] // ids opacos (ver identificadores.ts)
  inicioEm: string // "YYYY-MM-DDTHH:mm" (input datetime-local, hora de Brasília)
  fimEm: string
  veiculoNumero: string
  veiculoCapacidade: string
  lacres: string[]
  epis: Partial<Record<EpiCodigo, EpiStatus | null>>
  supervisorId: string
  liderId: string
  ocorrencia: string
}

export type CampoChecklist = keyof ChecklistPayload
export type ErroValidacao = { campo: CampoChecklist; mensagem: string }

/** Estado do wizard: o payload mais a etapa atual (rascunho salvo no aparelho). */
export type RascunhoChecklist = ChecklistPayload & { etapa: 1 | 2 | 3 | 4 }

function parseEpis(episBrutos: unknown): ChecklistPayload["epis"] {
  const o = (episBrutos && typeof episBrutos === "object" ? episBrutos : {}) as Record<string, unknown>
  const epis: ChecklistPayload["epis"] = {}
  for (const { codigo } of EPIS) {
    const v = o[codigo]
    epis[codigo] = EPI_STATUS.includes(v as EpiStatus) ? (v as EpiStatus) : null
  }
  return epis
}

export function normalizarFuncao(f: string | null | undefined): string {
  return (f ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
}

export const podeSerSupervisor = (p: PessoaSra) => normalizarFuncao(p.funcao) === FUNCAO_SUPERVISOR
export const podeSerLider = (p: PessoaSra) => normalizarFuncao(p.funcao) === FUNCAO_LIDER

export function normalizarPayload(bruto: unknown): ChecklistPayload {
  const o = (bruto && typeof bruto === "object" ? bruto : {}) as Record<string, unknown>
  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "")
  const lista = (v: unknown) =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
      : []
  return {
    operadores: Array.from(new Set(lista(o.operadores))),
    inicioEm: texto(o.inicioEm),
    fimEm: texto(o.fimEm),
    veiculoNumero: texto(o.veiculoNumero),
    veiculoCapacidade: texto(o.veiculoCapacidade),
    lacres: lista(o.lacres),
    epis: parseEpis(o.epis),
    supervisorId: texto(o.supervisorId),
    liderId: texto(o.liderId),
    ocorrencia: texto(o.ocorrencia),
  }
}

/**
 * Reconstrói um rascunho salvo no aparelho (localStorage) campo a campo, a partir
 * de uma lista FIXA de chaves — nunca espalha (`...`) o objeto bruto. Assim, um
 * rascunho de um formato antigo (ex.: `supervisorCpf`/`liderCpf` com CPF de
 * verdade, de antes do id opaco existir) nunca sobrevive: toda chave que não está
 * nesta lista é descartada, e os operadores são filtrados aos ids ainda ativos.
 */
export function sanitizarRascunho(bruto: unknown, idsAtivos: Iterable<string>): RascunhoChecklist {
  const o = (bruto && typeof bruto === "object" ? bruto : {}) as Record<string, unknown>
  const ativos = new Set(idsAtivos)
  const texto = (v: unknown) => (typeof v === "string" ? v : "")
  const listaTexto = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [])
  const etapaBruta = Number(o.etapa)
  const etapa = ([1, 2, 3, 4] as const).includes(etapaBruta as 1 | 2 | 3 | 4) ? (etapaBruta as 1 | 2 | 3 | 4) : 1

  return {
    etapa,
    operadores: listaTexto(o.operadores).filter((id) => ativos.has(id)),
    inicioEm: texto(o.inicioEm),
    fimEm: texto(o.fimEm),
    veiculoNumero: texto(o.veiculoNumero),
    veiculoCapacidade: texto(o.veiculoCapacidade),
    lacres: listaTexto(o.lacres),
    epis: parseEpis(o.epis),
    supervisorId: texto(o.supervisorId),
    liderId: texto(o.liderId),
    ocorrencia: texto(o.ocorrencia),
  }
}

const DATA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export function validarChecklist(p: ChecklistPayload, pessoas: PessoaSra[]): ErroValidacao[] {
  const erros: ErroValidacao[] = []
  const porId = new Map(pessoas.map((x) => [x.id, x]))

  if (p.operadores.length === 0) {
    erros.push({ campo: "operadores", mensagem: "Adicione pelo menos um operador." })
  } else if (p.operadores.some((c) => !porId.has(c))) {
    erros.push({
      campo: "operadores",
      mensagem: "Há operador que não está mais ativo na escala. Remova e adicione de novo.",
    })
  }

  const inicioOk = DATA_HORA.test(p.inicioEm)
  if (!inicioOk) erros.push({ campo: "inicioEm", mensagem: "Informe a data e hora de início." })
  if (!DATA_HORA.test(p.fimEm)) {
    erros.push({ campo: "fimEm", mensagem: "Informe a data e hora de fim." })
  } else if (inicioOk && p.fimEm < p.inicioEm) {
    erros.push({ campo: "fimEm", mensagem: "O fim não pode ser antes do início." })
  }

  if (!p.veiculoNumero) erros.push({ campo: "veiculoNumero", mensagem: "Informe o número do veículo." })
  if (!p.veiculoCapacidade) erros.push({ campo: "veiculoCapacidade", mensagem: "Informe a capacidade do veículo." })
  if (p.lacres.length > MAX_LACRES) erros.push({ campo: "lacres", mensagem: `Use no máximo ${MAX_LACRES} lacres.` })

  const semResposta = EPIS.filter((e) => !p.epis[e.codigo]).length
  if (semResposta > 0) erros.push({ campo: "epis", mensagem: `Responda todos os EPIs (faltam ${semResposta}).` })

  const sup = porId.get(p.supervisorId)
  if (!p.supervisorId) erros.push({ campo: "supervisorId", mensagem: "Escolha o supervisor responsável." })
  else if (!sup || !podeSerSupervisor(sup))
    erros.push({ campo: "supervisorId", mensagem: "A pessoa escolhida não é Supervisor de Logística na escala." })

  const lider = porId.get(p.liderId)
  if (!p.liderId) erros.push({ campo: "liderId", mensagem: "Escolha o líder responsável." })
  else if (!lider || !podeSerLider(lider))
    erros.push({ campo: "liderId", mensagem: "A pessoa escolhida não é Operador Logístico Líder na escala." })

  if (EPIS.some((e) => p.epis[e.codigo] === "nao") && !p.ocorrencia) {
    erros.push({
      campo: "ocorrencia",
      mensagem: "Algum EPI ficou como \"Não\": descreva o que aconteceu na ocorrência.",
    })
  }
  return erros
}

export function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean)
  if (p.length === 0) return "?"
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase()
}

export function nomeCurto(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean)
  if (p.length < 2) return p[0] ?? ""
  return `${p[0][0].toUpperCase()}. ${p[p.length - 1]}`
}

const MINUSCULAS = new Set(["DE", "DA", "DO", "DAS", "DOS", "E"])
const ROMANO = /^(I|II|III|IV|V)$/

export function formatarFuncao(f: string | null): string {
  if (!f) return ""
  return f
    .trim()
    .split(/\s+/)
    .map((w, i) => {
      const u = w.toUpperCase()
      if (ROMANO.test(u)) return u
      if (i > 0 && MINUSCULAS.has(u)) return u.toLowerCase()
      return u.charAt(0) + u.slice(1).toLowerCase()
    })
    .join(" ")
}

// Brasil não tem horário de verão desde 2019: Brasília = UTC−03:00 fixo.
export function paraDataBrasilia(s: string): Date {
  return new Date(`${s}:00-03:00`)
}

export function resumoEpis(epis: ChecklistPayload["epis"]): string {
  const n = EPIS.filter((e) => epis[e.codigo]).length
  return `${n} de ${EPIS.length} EPIs verificados`
}

const ETAPA: Record<CampoChecklist, 1 | 2 | 3 | 4> = {
  operadores: 1,
  inicioEm: 1,
  fimEm: 1,
  epis: 2,
  veiculoNumero: 3,
  veiculoCapacidade: 3,
  lacres: 3,
  supervisorId: 4,
  liderId: 4,
  ocorrencia: 4,
}
export const etapaDoCampo = (campo: CampoChecklist) => ETAPA[campo]
