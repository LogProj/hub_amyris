import { describe, expect, it } from "vitest"
import {
  EPIS,
  etapaDoCampo,
  formatarFuncao,
  iniciais,
  nomeCurto,
  normalizarPayload,
  paraDataBrasilia,
  podeSerSupervisor,
  resumoEpis,
  validarChecklist,
  type ChecklistPayload,
  type PessoaSra,
} from "./regras"

const PESSOAS: PessoaSra[] = [
  { id: "id-ana", nome: "Ana Souza", funcao: "OPERADOR LOGISTICO II" },
  { id: "id-bruno", nome: "Bruno Lima", funcao: "SUPERVISOR DE LOGISTICA" },
  { id: "id-carla", nome: "Carla Dias", funcao: "OPERADOR LOGISTICO LIDER" },
]

const todosSim = Object.fromEntries(EPIS.map((e) => [e.codigo, "sim"])) as ChecklistPayload["epis"]

function valido(parcial: Partial<ChecklistPayload> = {}): ChecklistPayload {
  return {
    operadores: ["id-ana"],
    inicioEm: "2026-09-11T07:30",
    fimEm: "2026-09-11T11:45",
    veiculoNumero: "1042",
    veiculoCapacidade: "28 t",
    lacres: ["A1"],
    epis: todosSim,
    supervisorId: "id-bruno",
    liderId: "id-carla",
    ocorrencia: "",
    ...parcial,
  }
}

const campos = (p: ChecklistPayload) => validarChecklist(p, PESSOAS).map((e) => e.campo)

describe("validarChecklist", () => {
  it("aceita um checklist completo", () => {
    expect(campos(valido())).toEqual([])
  })
  it("exige pelo menos um operador", () => {
    expect(campos(valido({ operadores: [] }))).toEqual(["operadores"])
  })
  it("recusa operador que não está ativo na SRA", () => {
    expect(campos(valido({ operadores: ["id-inexistente"] }))).toEqual(["operadores"])
  })
  it("exige início e fim", () => {
    expect(campos(valido({ inicioEm: "", fimEm: "" }))).toEqual(["inicioEm", "fimEm"])
  })
  it("recusa fim antes do início", () => {
    expect(campos(valido({ fimEm: "2026-09-11T06:00" }))).toEqual(["fimEm"])
  })
  it("exige número e capacidade do veículo", () => {
    expect(campos(valido({ veiculoNumero: "", veiculoCapacidade: "" }))).toEqual([
      "veiculoNumero",
      "veiculoCapacidade",
    ])
  })
  it("aceita no máximo 4 lacres", () => {
    expect(campos(valido({ lacres: ["1", "2", "3", "4", "5"] }))).toEqual(["lacres"])
  })
  it("exige os 7 EPIs respondidos", () => {
    expect(campos(valido({ epis: { ...todosSim, cinto: null } }))).toEqual(["epis"])
  })
  it("recusa supervisor sem o cargo de Supervisor de Logística", () => {
    expect(campos(valido({ supervisorId: "id-ana" }))).toEqual(["supervisorId"])
  })
  it("recusa líder sem o cargo de Operador Logístico Líder", () => {
    expect(campos(valido({ liderId: "id-bruno" }))).toEqual(["liderId"])
  })
  it("exige ocorrência quando algum EPI é Não", () => {
    expect(campos(valido({ epis: { ...todosSim, luva: "nao" } }))).toEqual(["ocorrencia"])
    expect(campos(valido({ epis: { ...todosSim, luva: "nao" }, ocorrencia: "Luva rasgada" }))).toEqual([])
  })
})

describe("normalizarPayload", () => {
  it("apara textos, remove lacres vazios, deduplica operadores e anula status inválido", () => {
    const p = normalizarPayload({
      operadores: ["111", " 111 ", "", 7],
      inicioEm: " 2026-09-11T07:30 ",
      veiculoNumero: " 1042 ",
      lacres: ["A1", "  ", "B2"],
      epis: { luva: "sim", bota: "talvez" },
      ocorrencia: "  ",
    })
    expect(p.operadores).toEqual(["111"])
    expect(p.inicioEm).toBe("2026-09-11T07:30")
    expect(p.veiculoNumero).toBe("1042")
    expect(p.lacres).toEqual(["A1", "B2"])
    expect(p.epis.luva).toBe("sim")
    expect(p.epis.bota).toBeNull()
    expect(p.ocorrencia).toBe("")
    expect(p.fimEm).toBe("")
  })
  it("tolera corpo que não é objeto", () => {
    expect(normalizarPayload(null).operadores).toEqual([])
  })
})

describe("formatações e utilitários", () => {
  it("compara cargo sem acento e sem caixa", () => {
    expect(podeSerSupervisor({ id: "id-x", nome: "X", funcao: "Supervisor de Logística" })).toBe(true)
  })
  it("gera iniciais", () => {
    expect(iniciais("Rafael Alves Souza")).toBe("RS")
    expect(iniciais("Ana")).toBe("A")
  })
  it("gera nome curto", () => {
    expect(nomeCurto("Rafael Alves Souza")).toBe("R. Souza")
    expect(nomeCurto("Ana")).toBe("Ana")
  })
  it("formata a função para leitura", () => {
    expect(formatarFuncao("OPERADOR LOGISTICO II")).toBe("Operador Logistico II")
    expect(formatarFuncao("SUPERVISOR DE LOGISTICA")).toBe("Supervisor de Logistica")
    expect(formatarFuncao(null)).toBe("")
  })
  it("interpreta data/hora do formulário como horário de Brasília", () => {
    expect(paraDataBrasilia("2026-09-11T07:30").toISOString()).toBe("2026-09-11T10:30:00.000Z")
  })
  it("resume EPIs respondidos", () => {
    expect(resumoEpis(todosSim)).toBe("7 de 7 EPIs verificados")
    expect(resumoEpis({})).toBe("0 de 7 EPIs verificados")
  })
  it("mapeia campo para etapa do wizard", () => {
    expect(etapaDoCampo("fimEm")).toBe(1)
    expect(etapaDoCampo("epis")).toBe(2)
    expect(etapaDoCampo("lacres")).toBe(3)
    expect(etapaDoCampo("ocorrencia")).toBe(4)
  })
})
