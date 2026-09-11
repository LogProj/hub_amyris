import { describe, expect, it } from "vitest"
import { mapearPessoas } from "./sra"

describe("mapearPessoas", () => {
  it("apara campos, descarta linha sem cpf e ordena por nome", () => {
    expect(
      mapearPessoas([
        { cpf: " 2 ", nome: " Bruno ", descricao_funcao: "SUPERVISOR DE LOGISTICA " },
        { cpf: "", nome: "Sem CPF", descricao_funcao: null },
        { cpf: "1", nome: "Ana", descricao_funcao: null },
        { cpf: "3", nome: null, descricao_funcao: "  " },
      ]),
    ).toEqual([
      { cpf: "1", nome: "Ana", funcao: null },
      { cpf: "2", nome: "Bruno", funcao: "SUPERVISOR DE LOGISTICA" },
      { cpf: "3", nome: "—", funcao: null },
    ])
  })
})
