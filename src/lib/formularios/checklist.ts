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

// Envios de TODOS os usuários (conferência entre turnos), mais recentes primeiro.
export async function listarHistorico(limite = 50): Promise<ItemHistorico[]> {
  const linhas = await prisma.ftAmyrisChecklistCarregamento.findMany({
    orderBy: { enviadoEm: "desc" },
    take: limite,
    include: { operadores: { select: { id: true } }, epis: { select: { status: true } } },
  })
  return linhas.map((l) => ({
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
  }))
}
