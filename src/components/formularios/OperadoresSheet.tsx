"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Check, Search, X } from "lucide-react"
import { formatarFuncao, iniciais, type PessoaSra } from "@/lib/formularios/regras"
import { GRAD } from "./ui"

export function OperadoresSheet({
  aberto,
  pessoas,
  selecionados,
  onAlternar,
  onFechar,
}: {
  aberto: boolean
  pessoas: PessoaSra[]
  selecionados: string[]
  onAlternar: (cpf: string) => void
  onFechar: () => void
}) {
  const [busca, setBusca] = useState("")
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  useEffect(() => {
    if (aberto) setBusca("")
  }, [aberto])

  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? pessoas.filter((p) => p.nome.toLowerCase().includes(q)) : pessoas
  }, [busca, pessoas])

  if (!montado || !aberto) return null
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[rgba(26,11,46,.45)] backdrop-blur-[2px]" onClick={onFechar} />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[78dvh] w-full max-w-[430px] flex-col rounded-t-[30px] bg-white px-4 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] shadow-[0_-20px_60px_-20px_rgba(26,11,46,.5)]">
        <span className="mx-auto mb-3 h-1 w-[38px] rounded-full bg-[#E7DEED]" />
        <div className="mb-3 flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold text-[#201429]">Operadores da SRA</p>
            <p className="text-[11px] text-[#6D5E78]">Todos os ativos do CR · toque para adicionar</p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[13px] bg-[#F4F0FB] text-[#4B0085]"
          >
            <X className="h-[17px] w-[17px]" />
          </button>
        </div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#6D5E78]" />
          <input
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome…"
            className="h-12 w-full rounded-2xl border border-[#E7DEED] bg-[#FBF8FF] pl-10 pr-3 text-[13px] outline-none focus:border-[rgba(75,0,133,.5)] focus:shadow-[0_0_0_3px_rgba(75,0,133,.16)]"
          />
        </div>
        <div className="-mx-1 flex-1 space-y-[7px] overflow-y-auto px-1 pb-1">
          {resultados.length === 0 && <p className="py-6 text-center text-sm text-[#8F82A0]">Ninguém encontrado.</p>}
          {resultados.map((p) => {
            const on = selecionados.includes(p.cpf)
            return (
              <button
                key={p.cpf}
                type="button"
                onClick={() => onAlternar(p.cpf)}
                className="flex w-full items-center gap-[11px] rounded-2xl border p-2.5 text-left transition"
                style={{ background: on ? "#F7F3FD" : "#fff", borderColor: on ? "rgba(124,58,237,.35)" : "#E7DEED" }}
              >
                <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[11px] bg-[#F4F0FB] text-xs font-bold text-[#4B0085]">
                  {iniciais(p.nome)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] font-semibold text-[#201429]">{p.nome}</span>
                  <span className="truncate text-[10px] text-[#6D5E78]">{formatarFuncao(p.funcao)}</span>
                </span>
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px]"
                  style={{ background: on ? GRAD : "#F1EBF8", color: on ? "#fff" : "#CFC4DA" }}
                >
                  <Check className="h-[15px] w-[15px]" />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}
