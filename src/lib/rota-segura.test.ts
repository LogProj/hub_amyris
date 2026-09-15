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

  it("vertical tab (%0B) e form feed (%0C) NÃO são removidos pelo parser — permanecem caminho interno (%-encoded), não são rejeitados", () => {
    // ?next=/%0B/evil.com e ?next=/%0C/evil.com: \v e \f não fazem parte da
    // whitelist de controle removido pelo parser de URL, então o "/evil.com"
    // não vira autoridade — o resultado é um path relativo mesmo-origem.
    expect(proximaRotaSegura("/\v/evil.com")).toBe("/%0B/evil.com")
    expect(proximaRotaSegura("/\f/evil.com")).toBe("/%0C/evil.com")
  })

  it("tab dentro do VALOR de uma query é removido pelo parser (inofensivo, comportamento fixado)", () => {
    // ?next=/formularios?x=%09//evil.com → o tab é removido pelo parser de
    // URL dentro da própria query string; o resultado fica com "x=//evil.com"
    // como valor de query (string, não afeta host/origem) — comportamento
    // atual documentado aqui para que uma mudança futura seja deliberada.
    expect(proximaRotaSegura("/formularios?x=\t//evil.com")).toBe(
      "/formularios?x=//evil.com",
    )
  })

  it("fallback customizado é usado quando next é ausente/vazio ou inseguro", () => {
    expect(proximaRotaSegura(null, "/dashboards")).toBe("/dashboards")
    expect(proximaRotaSegura("", "/dashboards")).toBe("/dashboards")
    expect(proximaRotaSegura("//evil.com", "/dashboards")).toBe("/dashboards")
    expect(proximaRotaSegura("/\\evil.com", "/dashboards")).toBe("/dashboards")
    expect(proximaRotaSegura("https://evil.com", "/dashboards")).toBe("/dashboards")
  })

  it("fallback customizado não interfere com next válido", () => {
    expect(proximaRotaSegura("/formularios", "/dashboards")).toBe("/formularios")
  })

  it("os quatro vetores do redirect /api/auth/refresh caem no fallback (/dashboards)", () => {
    // ?next=/%09/evil.com, /%0A/evil.com, /%5Cevil.com, /%09%5Cevil.com
    expect(proximaRotaSegura("/\t/evil.com", "/dashboards")).toBe("/dashboards")
    expect(proximaRotaSegura("/\n/evil.com", "/dashboards")).toBe("/dashboards")
    expect(proximaRotaSegura("/\\evil.com", "/dashboards")).toBe("/dashboards")
    expect(proximaRotaSegura("/\t\\evil.com", "/dashboards")).toBe("/dashboards")
  })
})
