import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { EPIS, paraDataBrasilia, type ChecklistPayload, type EpiStatus, type PessoaSra } from "./regras"

export type Autor = { usuarioId: number; email: string; nome: string | null }

export type RegistroChecklist = {
  criadoPorId: number | null
  criadoPorEmail: string
  criadoPorNome: string | null
  inicioEm: Date
  fimEm: Date
  veiculoNumero: string
  veiculoCapacidade: string
  lacres: string[]
  supervisorCpf: string
  supervisorNome: string
  supervisorFuncao: string
  liderCpf: string
  liderNome: string
  liderFuncao: string
  ocorrencia: string | null
  operadores: { create: { cpf: string; nome: string; funcao: string | null }[] }
  epis: { create: { epiCodigo: string; status: EpiStatus }[] }
}

// Pré-condição: `validarChecklist(p, pessoas)` retornou []. Grava a FOTO de nome e
// função do dia (a SRA muda diariamente; o checklist não pode depender dela depois).
export function montarRegistro(p: ChecklistPayload, pessoas: PessoaSra[], autor: Autor): RegistroChecklist {
  const porCpf = new Map(pessoas.map((x) => [x.cpf, x]))
  const pessoa = (cpf: string) => porCpf.get(cpf) as PessoaSra
  const sup = pessoa(p.supervisorCpf)
  const lider = pessoa(p.liderCpf)
  return {
    criadoPorId: autor.usuarioId > 0 ? autor.usuarioId : null,
    criadoPorEmail: autor.email,
    criadoPorNome: autor.nome,
    inicioEm: paraDataBrasilia(p.inicioEm),
    fimEm: paraDataBrasilia(p.fimEm),
    veiculoNumero: p.veiculoNumero,
    veiculoCapacidade: p.veiculoCapacidade,
    lacres: p.lacres,
    supervisorCpf: sup.cpf,
    supervisorNome: sup.nome,
    supervisorFuncao: sup.funcao ?? "",
    liderCpf: lider.cpf,
    liderNome: lider.nome,
    liderFuncao: lider.funcao ?? "",
    ocorrencia: p.ocorrencia || null,
    operadores: {
      create: p.operadores.map((cpf) => {
        const o = pessoa(cpf)
        return { cpf: o.cpf, nome: o.nome, funcao: o.funcao }
      }),
    },
    epis: { create: EPIS.map((e) => ({ epiCodigo: e.codigo, status: p.epis[e.codigo] as EpiStatus })) },
  }
}

// Create aninhado = uma única transação no Prisma (cabeçalho + operadores + EPIs).
export async function salvarChecklist(p: ChecklistPayload, pessoas: PessoaSra[], autor: Autor): Promise<number> {
  const r = await prisma.ftAmyrisChecklistCarregamento.create({
    data: montarRegistro(p, pessoas, autor),
    select: { id: true },
  })
  return r.id
}

export type ItemHistorico = {
  id: number
  enviadoEm: string
  inicioEm: string
  fimEm: string
  veiculoNumero: string
  veiculoCapacidade: string
  qtdOperadores: number
  qtdLacres: number
  epis: { sim: number; na: number; nao: number }
  supervisorNome: string
  liderNome: string
  enviadoPor: string
  ocorrencia: string | null
}

const INCLUI_HISTORICO = {
  operadores: { select: { id: true } },
  epis: { select: { status: true } },
} satisfies Prisma.FtAmyrisChecklistCarregamentoInclude

type LinhaHistorico = Prisma.FtAmyrisChecklistCarregamentoGetPayload<{ include: typeof INCLUI_HISTORICO }>

function paraItem(l: LinhaHistorico): ItemHistorico {
  return {
    id: l.id,
    enviadoEm: l.enviadoEm.toISOString(),
    inicioEm: l.inicioEm.toISOString(),
    fimEm: l.fimEm.toISOString(),
    veiculoNumero: l.veiculoNumero,
    veiculoCapacidade: l.veiculoCapacidade,
    qtdOperadores: l.operadores.length,
    qtdLacres: l.lacres.length,
    epis: {
      sim: l.epis.filter((e) => e.status === "sim").length,
      na: l.epis.filter((e) => e.status === "na").length,
      nao: l.epis.filter((e) => e.status === "nao").length,
    },
    supervisorNome: l.supervisorNome,
    liderNome: l.liderNome,
    enviadoPor: l.criadoPorNome ?? l.criadoPorEmail,
    ocorrencia: l.ocorrencia,
  }
}

export const POR_PAGINA = 20

const MES = /^(\d{4})-(\d{2})$/

/** Início (inclusive) e fim (exclusivo) do mês, em hora de Brasília. */
export function intervaloDoMes(mes: string): { inicio: Date; fim: Date } | null {
  const m = MES.exec(mes ?? "")
  if (!m) return null
  const ano = Number(m[1])
  const numero = Number(m[2])
  if (numero < 1 || numero > 12) return null
  const proximoAno = numero === 12 ? ano + 1 : ano
  const proximoMes = numero === 12 ? 1 : numero + 1
  const dois = (n: number) => String(n).padStart(2, "0")
  return {
    inicio: new Date(`${ano}-${dois(numero)}-01T00:00:00-03:00`),
    fim: new Date(`${proximoAno}-${dois(proximoMes)}-01T00:00:00-03:00`),
  }
}

/** Meses que têm carregamento registrado, pelo mês de INÍCIO em São Paulo. */
export async function listarMesesHistorico(): Promise<string[]> {
  const linhas = await prisma.$queryRaw<{ mes: string }[]>`
    select distinct to_char(inicio_em at time zone 'America/Sao_Paulo', 'YYYY-MM') as mes
      from public.ft_amyris_checklist_carregamento
     order by mes desc`
  return linhas.map((l) => l.mes)
}

export type PaginaHistorico = { itens: ItemHistorico[]; total: number; pagina: number; paginas: number }

// Envios de TODOS os usuários (conferência entre turnos), mais recentes primeiro,
// opcionalmente de um mês de carregamento só, em páginas de POR_PAGINA.
export async function listarHistorico(
  opcoes: { mes?: string; pagina?: number; porPagina?: number } = {},
): Promise<PaginaHistorico> {
  const porPagina = opcoes.porPagina ?? POR_PAGINA
  const intervalo = opcoes.mes ? intervaloDoMes(opcoes.mes) : null
  const where = intervalo ? { inicioEm: { gte: intervalo.inicio, lt: intervalo.fim } } : {}

  const total = await prisma.ftAmyrisChecklistCarregamento.count({ where })
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  const pagina = Math.min(Math.max(1, opcoes.pagina ?? 1), paginas)

  const linhas = await prisma.ftAmyrisChecklistCarregamento.findMany({
    where,
    orderBy: { inicioEm: "desc" },
    skip: (pagina - 1) * porPagina,
    take: porPagina,
    include: INCLUI_HISTORICO,
  })

  return { itens: linhas.map(paraItem), total, pagina, paginas }
}

export type DetalheChecklist = {
  id: number
  enviadoEm: string
  inicioEm: string
  fimEm: string
  veiculoNumero: string
  veiculoCapacidade: string
  lacres: string[]
  supervisorNome: string
  supervisorFuncao: string
  liderNome: string
  liderFuncao: string
  ocorrencia: string | null
  enviadoPor: string
  operadores: { nome: string; funcao: string | null }[]
  epis: { codigo: string; nome: string; status: EpiStatus }[]
}

/** Um checklist inteiro para a tela de detalhe. CPF não sai daqui. */
export async function obterChecklist(id: number): Promise<DetalheChecklist | null> {
  const l = await prisma.ftAmyrisChecklistCarregamento.findUnique({
    where: { id },
    include: {
      operadores: { select: { nome: true, funcao: true }, orderBy: { nome: "asc" } },
      epis: { select: { status: true, epi: { select: { codigo: true, nome: true, ordem: true } } }, orderBy: { epi: { ordem: "asc" } } },
    },
  })
  if (!l) return null
  return {
    id: l.id,
    enviadoEm: l.enviadoEm.toISOString(),
    inicioEm: l.inicioEm.toISOString(),
    fimEm: l.fimEm.toISOString(),
    veiculoNumero: l.veiculoNumero,
    veiculoCapacidade: l.veiculoCapacidade,
    lacres: l.lacres,
    supervisorNome: l.supervisorNome,
    supervisorFuncao: l.supervisorFuncao,
    liderNome: l.liderNome,
    liderFuncao: l.liderFuncao,
    ocorrencia: l.ocorrencia,
    enviadoPor: l.criadoPorNome ?? l.criadoPorEmail,
    operadores: l.operadores.map((o) => ({ nome: o.nome, funcao: o.funcao })),
    epis: l.epis.map((e) => ({ codigo: e.epi.codigo, nome: e.epi.nome, status: e.status as EpiStatus })),
  }
}
