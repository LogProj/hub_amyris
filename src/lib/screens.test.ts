import { describe, expect, it } from "vitest"
import { HUB_SCREENS, mesclarTelas, podeVerTela, primeiraTelaPermitida, sanitizeScreens } from "./screens"

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

describe("mesclarTelas", () => {
  it("mantém chaves de outros hubs quando o admin salva um subconjunto deste hub", () => {
    const existentes = ["absenteismo", "desvios-painel", "enjoei-turnover", "home"]
    // admin editou no modal e agora só quer manter "absenteismo" deste hub
    expect(mesclarTelas(existentes, ["absenteismo"])).toEqual([
      "absenteismo",
      "desvios-painel",
      "enjoei-turnover",
      "home",
    ])
  })

  it("remove uma tela deste hub que o admin desmarcou, sem tocar nas de outros hubs", () => {
    expect(mesclarTelas(["absenteismo", "turnover", "desvios-painel"], ["absenteismo"])).toEqual([
      "absenteismo",
      "desvios-painel",
    ])
  })

  it("adiciona uma chave conhecida recém-concedida", () => {
    const existentes = ["desvios-painel"]
    expect(mesclarTelas(existentes, ["formularios"])).toEqual(["formularios", "desvios-painel"])
  })

  it("descarta lixo desconhecido do payload que não pertence a nenhuma tela deste hub", () => {
    expect(mesclarTelas([], ["formularios", "chave-inventada"])).toEqual(["formularios"])
  })

  it("trata existentes null/undefined/não-array como sem chaves de outros hubs", () => {
    expect(mesclarTelas(null, ["formularios"])).toEqual(["formularios"])
    expect(mesclarTelas(undefined, ["formularios"])).toEqual(["formularios"])
    // @ts-expect-error entrada inválida propositalmente para testar robustez
    expect(mesclarTelas("nao-array", ["formularios"])).toEqual(["formularios"])
  })

  it("trata novas null/undefined/não-array como nenhuma tela deste hub concedida", () => {
    expect(mesclarTelas(["desvios-painel"], null)).toEqual(["desvios-painel"])
    expect(mesclarTelas(["desvios-painel"], undefined)).toEqual(["desvios-painel"])
  })

  it("não duplica uma chave presente nas duas listas", () => {
    expect(mesclarTelas(["formularios", "desvios-painel"], ["formularios"])).toEqual([
      "formularios",
      "desvios-painel",
    ])
  })
})
