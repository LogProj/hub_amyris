import { describe, expect, it } from "vitest"
import { ehCelular } from "./dispositivo"

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36"
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
const TABLET_ANDROID =
  "Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
const WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

describe("ehCelular", () => {
  it("reconhece celulares", () => {
    expect(ehCelular(IPHONE)).toBe(true)
    expect(ehCelular(ANDROID)).toBe(true)
  })
  it("reconhece tablets", () => {
    expect(ehCelular(IPAD)).toBe(true)
    expect(ehCelular(TABLET_ANDROID)).toBe(true)
  })
  it("não confunde computador com celular", () => {
    expect(ehCelular(WINDOWS)).toBe(false)
    expect(ehCelular(MAC)).toBe(false)
  })
  it("trata ausência de informação como computador", () => {
    expect(ehCelular(null)).toBe(false)
    expect(ehCelular("")).toBe(false)
    expect(ehCelular(undefined)).toBe(false)
  })
})
