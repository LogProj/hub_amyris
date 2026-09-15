"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { HORAS_DO_DIA, MINUTOS, gradeDoMes, hojeBrasilia, horaValida, juntar, rotuloMesAno, separar } from "@/lib/formularios/calendario"
import { Roleta } from "./Roleta"
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
  const [hora, setHora] = useState(inicial.hora)

  // Reabrir sempre parte do valor atual do campo.
  useEffect(() => {
    if (!aberto) return
    const atual = separar(valor)
    const ref = atual.data || hojeBrasilia()
    setAno(Number(ref.slice(0, 4)))
    setMes(Number(ref.slice(5, 7)))
    setData(atual.data)
    setHora(atual.hora)
  }, [aberto, valor])

  const mudarMes = (passo: number) => {
    const d = new Date(Date.UTC(ano, mes - 1 + passo, 1))
    setAno(d.getUTCFullYear())
    setMes(d.getUTCMonth() + 1)
  }

  const hoje = hojeBrasilia()
  const [hh, mm] = hora ? hora.split(":") : ["", ""]
  const pronto = !!data && horaValida(hora)

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

        <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A79BB0]">Horário</p>
        <div className="flex items-stretch gap-3 rounded-[14px] border border-[#E7DEED] bg-white px-3 py-2">
          <Roleta rotulo="Hora" itens={HORAS_DO_DIA} valor={hh || "07"} onMudar={(h) => setHora(`${h}:${mm || "00"}`)} />
          <span className="self-center text-xl font-bold text-[#6D5E78]">:</span>
          <Roleta rotulo="Minuto" itens={MINUTOS} valor={mm || "00"} onMudar={(m) => setHora(`${hh || "07"}:${m}`)} />
        </div>
      </div>

      <button
        type="button"
        disabled={!pronto}
        onClick={() => {
          onConfirmar(juntar(data, hora))
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
