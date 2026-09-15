import { describe, expect, it } from "vitest"
import { proximaRotaSegura } from "./rota-segura"

describe("proximaRotaSegura", () => {
  it("sem next, cai na raiz", () => {
    expect(proximaRotaSegura(null)).toBe("/")
    expect(proximaRotaSegura("")).toBe("/")
  })

  it("aceita caminho relativo simples", () => {
    expect(proximaRotaSegura("/formularios")).toBe("/formularios")
  })

  it("preserva query e hash de um caminho relativo válido", () => {
    expect(proximaRotaSegura("/dashboards/turnover?mes=2026-09")).toBe(
      "/dashboards/turnover?mes=2026-09",
    )
    expect(proximaRotaSegura("/dashboards/turnover#secao")).toBe("/dashboards/turnover#secao")
    expect(proximaRotaSegura("/dashboards/turnover?mes=2026-09#secao")).toBe(
      "/dashboards/turnover?mes=2026-09#secao",
    )
  })

  it("rejeita protocol-relative (//)", () => {
    expect(proximaRotaSegura("//evil.com")).toBe("/")
  })

  it("rejeita backslash logo após a barra (/\\evil.com)", () => {
    expect(proximaRotaSegura("/\\evil.com")).toBe("/")
  })

  it("rejeita URL absoluta", () => {
    expect(proximaRotaSegura("https://evil.com")).toBe("/")
  })

  it("rejeita esquema não-http (javascript:)", () => {
    expect(proximaRotaSegura("javascript:alert(1)")).toBe("/")
  })

  it("rejeita tab/CR/LF logo após a barra que, decodificados, formam // ou /\\ (bypass do filtro de prefixo)", () => {
    // Simula o valor já decodificado por URLSearchParams.get para
    // ?next=/%09/evil.com, ?next=/%0A/evil.com, ?next=/%0D/evil.com
    expect(proximaRotaSegura("/\t/evil.com")).toBe("/")
    expect(proximaRotaSegura("/\n/evil.com")).toBe("/")
    expect(proximaRotaSegura("/\r/evil.com")).toBe("/")
    // ?next=/%09%5Cevil.com → "/\t\\evil.com"
    expect(proximaRotaSegura("/\t\\evil.com")).toBe("/")
    // ?next=/%09%2F%2Fevil.com → "/\t//evil.com"
    expect(proximaRotaSegura("/\t//evil.com")).toBe("/")
  })
})
