import { describe, expect, it } from "vitest"
import { idDaPessoa } from "./identificadores"

describe("idDaPessoa", () => {
  it("é estável para o mesmo CPF", () => {
    expect(idDaPessoa("12345678901")).toBe(idDaPessoa("12345678901"))
  })
  it("é diferente para CPFs diferentes", () => {
    expect(idDaPessoa("12345678901")).not.toBe(idDaPessoa("10987654321"))
  })
  it("não contém o CPF", () => {
    expect(idDaPessoa("12345678901")).not.toContain("12345678901")
  })
  it("é curto e seguro para URL/JSON", () => {
    expect(idDaPessoa("12345678901")).toMatch(/^[A-Za-z0-9_-]{16}$/)
  })
})
