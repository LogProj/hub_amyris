import { describe, expect, it } from "vitest"
import { HORAS_DO_DIA, MINUTOS, formatarDataHora, gradeDoMes, horaValida, juntar, rotuloMesAno, separar } from "./calendario"

describe("separar / juntar", () => {
  it("separa data e hora", () => {
    expect(separar("2026-09-11T07:30")).toEqual({ data: "2026-09-11", hora: "07:30" })
  })
  it("devolve vazio para valor inválido", () => {
    expect(separar("")).toEqual({ data: "", hora: "" })
    expect(separar("11/09/2026")).toEqual({ data: "", hora: "" })
  })
  it("junta data e hora", () => {
    expect(juntar("2026-09-11", "07:30")).toBe("2026-09-11T07:30")
  })
  it("não junta se faltar parte", () => {
    expect(juntar("2026-09-11", "")).toBe("")
    expect(juntar("", "07:30")).toBe("")
  })
})

describe("formatarDataHora", () => {
  it("formata para leitura", () => {
    expect(formatarDataHora("2026-09-11T07:30")).toBe("11/09/2026 · 07:30")
  })
  it("devolve vazio para valor inválido", () => {
    expect(formatarDataHora("")).toBe("")
  })
})

describe("rotuloMesAno", () => {
  it("nomeia o mês em português", () => {
    expect(rotuloMesAno(2026, 9)).toBe("Setembro de 2026")
    expect(rotuloMesAno(2026, 1)).toBe("Janeiro de 2026")
  })
})

describe("gradeDoMes", () => {
  const grade = gradeDoMes(2026, 9) // setembro/2026 começa numa terça-feira

  it("tem 42 posições", () => {
    expect(grade).toHaveLength(42)
  })
  it("deixa vazias as posições antes do dia 1 (semana começa no domingo)", () => {
    expect(grade[0]).toBeNull()
    expect(grade[1]).toBeNull()
    expect(grade[2]).toBe("2026-09-01")
  })
  it("cobre todos os dias do mês e nada além", () => {
    const dias = grade.filter((d): d is string => d !== null)
    expect(dias).toHaveLength(30)
    expect(dias[29]).toBe("2026-09-30")
  })
  it("lida com fevereiro bissexto", () => {
    const fev = gradeDoMes(2028, 2).filter((d): d is string => d !== null)
    expect(fev).toHaveLength(29)
  })
})

describe("listas das roletas", () => {
  it("tem 24 horas, de 00 a 23", () => {
    expect(HORAS_DO_DIA).toHaveLength(24)
    expect(HORAS_DO_DIA[0]).toBe("00")
    expect(HORAS_DO_DIA[23]).toBe("23")
  })
  it("tem 60 minutos, de 00 a 59", () => {
    expect(MINUTOS).toHaveLength(60)
    expect(MINUTOS[0]).toBe("00")
    expect(MINUTOS[45]).toBe("45")
    expect(MINUTOS[59]).toBe("59")
  })
  it("todos com dois dígitos", () => {
    for (const v of [...HORAS_DO_DIA, ...MINUTOS]) expect(v).toMatch(/^\d{2}$/)
  })
})

describe("horaValida", () => {
  it("aceita HH:MM de 00:00 a 23:59", () => {
    expect(horaValida("00:00")).toBe(true)
    expect(horaValida("07:45")).toBe(true)
    expect(horaValida("23:59")).toBe(true)
  })
  it("recusa formato ou faixa inválidos", () => {
    for (const h of ["", "7:45", "24:00", "07:60", "0745", "ab:cd"]) expect(horaValida(h)).toBe(false)
  })
})

