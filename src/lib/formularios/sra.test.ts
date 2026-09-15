import { describe, expect, it } from "vitest"
import { idDaPessoa } from "./identificadores"
import { mapearPessoas, paraCliente } from "./sra"

describe("mapearPessoas", () => {
  it("apara campos, descarta linha sem cpf, ordena por nome e calcula o id opaco", () => {
    expect(
      mapearPessoas([
        { cpf: " 2 ", nome: " Bruno ", descricao_funcao: "SUPERVISOR DE LOGISTICA " },
        { cpf: "", nome: "Sem CPF", descricao_funcao: null },
        { cpf: "1", nome: "Ana", descricao_funcao: null },
        { cpf: "3", nome: null, descricao_funcao: "  " },
      ]),
    ).toEqual([
      { id: idDaPessoa("1"), cpf: "1", nome: "Ana", funcao: null },
      { id: idDaPessoa("2"), cpf: "2", nome: "Bruno", funcao: "SUPERVISOR DE LOGISTICA" },
      { id: idDaPessoa("3"), cpf: "3", nome: "—", funcao: null },
    ])
  })
})

describe("paraCliente", () => {
  it("não deixa CPF ir para o cliente", () => {
    const pessoas = mapearPessoas([{ cpf: "12345678901", nome: "Ana", descricao_funcao: null }])
    expect(JSON.stringify(paraCliente(pessoas))).not.toContain("12345678901")
  })
})
