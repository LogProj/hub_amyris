"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { HORAS, gradeDoMes, hojeBrasilia, horaValida, juntar, normalizarHora, rotuloMesAno, separar } from "@/lib/formularios/calendario"
import { Sheet } from "./Sheet"
import { GRAD } from "./ui"

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"]

export function DataHoraSheet({
  aberto,
  titulo,
  valor,
  onConfirmar,
  onFechar,
}: {
  aberto: boolean
  titulo: string
  valor: string
  onConfirmar: (valor: string) => void
  onFechar: () => void
}) {
  const inicial = separar(valor)
  const base = inicial.data || hojeBrasilia()
  const [ano, setAno] = useState(Number(base.slice(0, 4)))
  const [mes, setMes] = useState(Number(base.slice(5, 7)))
  const [data, setData] = useState(inicial.data)
  const [horaTexto, setHoraTexto] = useState(inicial.hora)

  // Reabrir sempre parte do valor atual do campo.
  useEffect(() => {
    if (!aberto) return
    const atual = separar(valor)
    const ref = atual.data || hojeBrasilia()
    setAno(Number(ref.slice(0, 4)))
    setMes(Number(ref.slice(5, 7)))
    setData(atual.data)
    setHoraTexto(atual.hora)
  }, [aberto, valor])

  const mudarMes = (passo: number) => {
    const d = new Date(Date.UTC(ano, mes - 1 + passo, 1))
    setAno(d.getUTCFullYear())
    setMes(d.getUTCMonth() + 1)
  }

  const hoje = hojeBrasilia()
  const horaFinal = normalizarHora(horaTexto)
  const horaInvalida = !!horaTexto && !horaValida(horaFinal)
  const pronto = !!data && horaValida(horaFinal)

  return (
    <Sheet aberto={aberto} titulo={titulo} subtitulo="Escolha o dia e o horário" onFechar={onFechar}>
      <div className="flex-1 overflow-y-auto pb-1">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={() => mudarMes(-1)} aria-label="Mês anterior" className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#F4F0FB] text-[#4B0085]">
            <ChevronLeft className="h-[17px] w-[17px]" />
          </button>
          <p className="font-display text-sm font-semibold text-[#201429]">{rotuloMesAno(ano, mes)}</p>
          <button type="button" onClick={() => mudarMes(1)} aria-label="Próximo mês" className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#F4F0FB] text-[#4B0085]">
            <ChevronRight className="h-[17px] w-[17px]" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {DIAS_SEMANA.map((d, i) => (
            <span key={i} className="py-1 text-[10px] font-semibold uppercase text-[#A79BB0]">
              {d}
            </span>
          ))}
          {gradeDoMes(ano, mes).map((dia, i) => {
            if (!dia) return <span key={i} />
            const selecionado = dia === data
            const ehHoje = dia === hoje
            return (
              <button
                key={i}
                type="button"
                onClick={() => setData(dia)}
                aria-pressed={selecionado}
                className="grid h-10 place-items-center rounded-[12px] text-[13px] font-semibold transition"
                style={{
                  background: selecionado ? GRAD : ehHoje ? "#F4F0FB" : "transparent",
                  color: selecionado ? "#fff" : "#201429",
                }}
              >
                {Number(dia.slice(8))}
              </button>
            )
          })}
        </div>

        <label htmlFor="checklist-hora-texto" className="mb-2 mt-4 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A79BB0]">
          Horário
        </label>
        <input
          id="checklist-hora-texto"
          value={horaTexto}
          onChange={(e) => setHoraTexto(e.target.value)}
          onBlur={() => {
            const n = normalizarHora(horaTexto)
            if (n) setHoraTexto(n)
          }}
          inputMode="numeric"
          placeholder="Ex. 07:45"
          aria-invalid={horaInvalida}
          aria-describedby={horaInvalida ? "checklist-hora-erro" : undefined}
          className="h-[46px] w-full rounded-[14px] border border-[#E7DEED] bg-white px-3 text-[15px] font-semibold text-[#201429] outline-none focus:border-[rgba(75,0,133,.5)] focus:shadow-[0_0_0_3px_rgba(75,0,133,.16)]"
        />
        {horaInvalida && (
          <p id="checklist-hora-erro" className="mt-1.5 text-xs font-medium text-[#C42B2B]">
            Use um horário entre 00:00 e 23:59.
          </p>
        )}

        <p className="mb-2 mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A79BB0]">Sugestões</p>
        <div className="grid grid-cols-4 gap-1.5">
          {HORAS.map((h) => {
            const on = h === horaFinal
            return (
              <button
                key={h}
                type="button"
                onClick={() => setHoraTexto(h)}
                aria-pressed={on}
                className="h-9 rounded-[12px] border text-[12px] font-semibold transition"
                style={{
                  background: on ? GRAD : "#fff",
                  color: on ? "#fff" : "#201429",
                  borderColor: on ? "transparent" : "#E7DEED",
                }}
              >
                {h}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={!pronto}
        onClick={() => {
          onConfirmar(juntar(data, horaFinal))
          onFechar()
        }}
        className="mt-3 h-12 shrink-0 rounded-2xl text-[15px] font-semibold text-white transition disabled:opacity-40"
        style={{ background: GRAD }}
      >
        Confirmar
      </button>
    </Sheet>
  )
}
