import { afterEach, describe, expect, it, vi } from "vitest"
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

describe("segredo do id (produção)", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("sem FORMULARIOS_ID_SECRET/AUTH_API_KEY em produção, importar o módulo não lança — só chamar idDaPessoa lança", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("FORMULARIOS_ID_SECRET", "")
    vi.stubEnv("AUTH_API_KEY", "")
    // O import já aconteceu no topo do arquivo sem lançar (prova de que o
    // módulo não falha em import/build time). A falha só ocorre ao chamar.
    expect(() => idDaPessoa("12345678901")).toThrow(
      "FORMULARIOS_ID_SECRET (ou AUTH_API_KEY) é obrigatório em produção",
    )
  })

  it("com FORMULARIOS_ID_SECRET definido em produção, retorna um id de 16 caracteres base64url", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("FORMULARIOS_ID_SECRET", "segredo-de-teste")
    vi.stubEnv("AUTH_API_KEY", "")
    expect(idDaPessoa("12345678901")).toMatch(/^[A-Za-z0-9_-]{16}$/)
  })

  it("fora de produção, funciona com o fallback de desenvolvimento mesmo sem nenhuma variável definida", () => {
    vi.stubEnv("NODE_ENV", "test")
    vi.stubEnv("FORMULARIOS_ID_SECRET", "")
    vi.stubEnv("AUTH_API_KEY", "")
    expect(() => idDaPessoa("12345678901")).not.toThrow()
    expect(idDaPessoa("12345678901")).toMatch(/^[A-Za-z0-9_-]{16}$/)
  })
})
