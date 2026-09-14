"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { CalendarRange, Check } from "lucide-react"
import { rotuloMesAno } from "@/lib/formularios/calendario"
import { Sheet } from "./Sheet"
import { GRAD } from "./ui"

export function FiltroMes({ meses, atual }: { meses: string[]; atual: string | null }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)

  const rotulo = (mes: string) => rotuloMesAno(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)))
  const escolher = (mes: string | null) => {
    setAberto(false)
    router.push(mes ? `/formularios/historico?mes=${mes}` : "/formularios/historico")
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex h-[42px] w-full items-center gap-2.5 rounded-[14px] border border-[#E7DEED] bg-white px-3 text-left text-[13px] font-semibold text-[#201429]"
      >
        <CalendarRange className="h-[17px] w-[17px] text-[#7C3AED]" />
        <span className="flex-1 truncate">{atual ? rotulo(atual) : "Todos os meses"}</span>
        <span className="text-[11px] font-semibold text-[#7C3AED]">Trocar</span>
      </button>

      <Sheet aberto={aberto} titulo="Filtrar por mês" subtitulo="Mês do carregamento" onFechar={() => setAberto(false)}>
        <div className="-mx-1 flex-1 space-y-[7px] overflow-y-auto px-1 pb-1">
          <OpcaoMes rotulo="Todos os meses" ativo={!atual} onClick={() => escolher(null)} />
          {meses.map((m) => (
            <OpcaoMes key={m} rotulo={rotulo(m)} ativo={atual === m} onClick={() => escolher(m)} />
          ))}
          {meses.length === 0 && <p className="py-6 text-center text-sm text-[#8F82A0]">Nenhum carregamento registrado ainda.</p>}
        </div>
      </Sheet>
    </>
  )
}

function OpcaoMes({ rotulo, ativo, onClick }: { rotulo: string; ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-[13px] font-semibold transition"
      style={{ background: ativo ? "#F7F3FD" : "#fff", borderColor: ativo ? "rgba(124,58,237,.35)" : "#E7DEED", color: "#201429" }}
    >
      <span className="flex-1 truncate">{rotulo}</span>
      {ativo && (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-white" style={{ background: GRAD }}>
          <Check className="h-[15px] w-[15px]" />
        </span>
      )}
    </button>
  )
}
