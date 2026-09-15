"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { GRAD } from "./ui"

export function ConfirmacaoEnvio({ id, onNovo }: { id: number; onNovo: () => void }) {
  return (
    <div className="flex flex-col items-center pt-12 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full text-white shadow-[0_20px_46px_-14px_rgba(75,0,133,.62)]" style={{ background: GRAD }}>
        <CheckCircle2 className="h-10 w-10" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold text-[#201429]">Checklist enviado</h1>
      <p className="mt-1 text-sm text-[#6B5E7B]">Registro nº {id} salvo com sucesso.</p>
      <div className="mt-8 grid w-full gap-3">
        <button type="button" onClick={onNovo} className="h-12 rounded-2xl font-semibold text-white" style={{ background: GRAD }}>
          Novo checklist
        </button>
        <Link href="/formularios/historico" className="grid h-12 place-items-center rounded-2xl border border-[#E7DEED] bg-white font-semibold text-[#4B0085]">
          Ver histórico
        </Link>
      </div>
    </div>
  )
}
