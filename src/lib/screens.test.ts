import { describe, expect, it } from "vitest"
import { HUB_SCREENS, podeVerTela, primeiraTelaPermitida, sanitizeScreens } from "./screens"

describe("registro de telas", () => {
  it("inclui Formulários como tela concedível", () => {
    const f = HUB_SCREENS.find((s) => s.key === "formularios")
    expect(f).toEqual({ key: "formularios", label: "Formulários", href: "/formularios" })
  })
  it("aceita a chave nova ao sanear", () => {
    expect(sanitizeScreens(["formularios", "inventada"])).toEqual(["formularios"])
  })
})

describe("podeVerTela", () => {
  it("admin vê tudo", () => {
    expect(podeVerTela({ isAdmin: true, visibleScreens: [] }, "turnover")).toBe(true)
  })
  it("usuário vê só o que foi concedido", () => {
    const auth = { isAdmin: false, visibleScreens: ["formularios"] }
    expect(podeVerTela(auth, "formularios")).toBe(true)
    expect(podeVerTela(auth, "turnover")).toBe(false)
    expect(podeVerTela(auth, "visao-geral")).toBe(false)
  })
  it("sem sessão não vê nada", () => {
    expect(podeVerTela(null, "formularios")).toBe(false)
  })
})

describe("primeiraTelaPermitida", () => {
  it("admin vai para a visão geral", () => {
    expect(primeiraTelaPermitida({ isAdmin: true, visibleScreens: [] })).toBe("/dashboards")
  })
  it("quem só tem formulário vai para o formulário", () => {
    expect(primeiraTelaPermitida({ isAdmin: false, visibleScreens: ["formularios"] })).toBe("/formularios")
  })
  it("segue a ordem do registro quando há várias", () => {
    expect(primeiraTelaPermitida({ isAdmin: false, visibleScreens: ["turnover", "absenteismo"] })).toBe(
      "/dashboards/absenteismo",
    )
  })
  it("sem nenhuma tela, vai para o aviso", () => {
    expect(primeiraTelaPermitida({ isAdmin: false, visibleScreens: [] })).toBe("/sem-acesso")
  })
})
