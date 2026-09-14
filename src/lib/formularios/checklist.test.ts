import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({ prisma: {} }))

import { intervaloDoMes, listarHistorico, montarRegistro } from "./checklist"
import { EPIS, type ChecklistPayload, type PessoaSra } from "./regras"

const PESSOAS: PessoaSra[] = [
  { cpf: "111", nome: "Ana Souza", funcao: "OPERADOR LOGISTICO II" },
  { cpf: "222", nome: "Bruno Lima", funcao: "SUPERVISOR DE LOGISTICA" },
  { cpf: "333", nome: "Carla Dias", funcao: "OPERADOR LOGISTICO LIDER" },
]

const payload: ChecklistPayload = {
  operadores: ["111", "333"],
  inicioEm: "2026-09-11T07:30",
  fimEm: "2026-09-11T11:45",
  veiculoNumero: "1042",
  veiculoCapacidade: "28 t",
  lacres: ["A1"],
  epis: Object.fromEntries(EPIS.map((e) => [e.codigo, "sim"])) as ChecklistPayload["epis"],
  supervisorCpf: "222",
  liderCpf: "333",
  ocorrencia: "",
}

describe("montarRegistro", () => {
  it("grava foto de nome/função, horários em Brasília e uma resposta por EPI", () => {
    const r = montarRegistro(payload, PESSOAS, { usuarioId: 0, email: "x@y.com", nome: null })
    expect(r.criadoPorId).toBeNull()
    expect(r.inicioEm.toISOString()).toBe("2026-09-11T10:30:00.000Z")
    expect(r.supervisorNome).toBe("Bruno Lima")
    expect(r.liderFuncao).toBe("OPERADOR LOGISTICO LIDER")
    expect(r.ocorrencia).toBeNull()
    expect(r.operadores.create).toEqual([
      { cpf: "111", nome: "Ana Souza", funcao: "OPERADOR LOGISTICO II" },
      { cpf: "333", nome: "Carla Dias", funcao: "OPERADOR LOGISTICO LIDER" },
    ])
    expect(r.epis.create).toHaveLength(7)
    expect(r.epis.create[0]).toEqual({ epiCodigo: "luva", status: "sim" })
  })
})

describe("intervaloDoMes", () => {
  it("cobre o mês inteiro em hora de Brasília", () => {
    const r = intervaloDoMes("2026-09")
    expect(r?.inicio.toISOString()).toBe("2026-09-01T03:00:00.000Z")
    expect(r?.fim.toISOString()).toBe("2026-10-01T03:00:00.000Z")
  })
  it("vira o ano em dezembro", () => {
    const r = intervaloDoMes("2026-12")
    expect(r?.fim.toISOString()).toBe("2027-01-01T03:00:00.000Z")
  })
  it("recusa mês inválido", () => {
    expect(intervaloDoMes("")).toBeNull()
    expect(intervaloDoMes("2026-13")).toBeNull()
    expect(intervaloDoMes("setembro")).toBeNull()
  })
})

describe("listarHistorico", () => {
  it("retorna página vazia (em vez do histórico inteiro) quando o mês é inválido", async () => {
    // `prisma` é mockado como {} acima: se o código tentasse consultar o banco aqui,
    // a chamada a `prisma.ftAmyrisChecklistCarregamento.count` estouraria (não é função).
    const r = await listarHistorico({ mes: "setembro" })
    expect(r).toEqual({ itens: [], total: 0, pagina: 1, paginas: 1 })
  })
})
