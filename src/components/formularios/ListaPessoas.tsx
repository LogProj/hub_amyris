"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Search } from "lucide-react"
import { formatarFuncao, iniciais, type PessoaSra } from "@/lib/formularios/regras"
import { GRAD } from "./ui"

/**
 * Lista de pessoas com busca, usada dentro de um `Sheet` (OperadoresSheet e PessoaSheet).
 * `modo` controla como o badge de seleção aparece:
 * - "multipla": badge sempre visível, preenchido quando selecionado, apagado quando não.
 * - "unica": badge só aparece na pessoa selecionada.
 *
 * O estado de busca é próprio (reseta quando `aberto` volta a ser true) porque este
 * componente permanece montado mesmo com o Sheet fechado (é filho sempre presente na
 * árvore do componente que o usa).
 */
export function ListaPessoas({
  aberto,
  pessoas,
  modo,
  selecionados,
  selecionado,
  onSelecionar,
  ocultarBuscaSeCurta = false,
}: {
  aberto: boolean
  pessoas: PessoaSra[]
  modo: "unica" | "multipla"
  selecionados?: string[]
  selecionado?: string
  onSelecionar: (cpf: string) => void
  ocultarBuscaSeCurta?: boolean
}) {
  const [busca, setBusca] = useState("")
  useEffect(() => {
    if (aberto) setBusca("")
  }, [aberto])

  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? pessoas.filter((p) => p.nome.toLowerCase().includes(q)) : pessoas
  }, [busca, pessoas])

  const mostrarBusca = !ocultarBuscaSeCurta || pessoas.length > 6

  return (
    <>
      {mostrarBusca && (
        <div className="relative mb-3 shrink-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#6D5E78]" />
          <input
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome…"
            className="h-12 w-full rounded-2xl border border-[#E7DEED] bg-[#FBF8FF] pl-10 pr-3 text-[13px] outline-none focus:border-[rgba(75,0,133,.5)] focus:shadow-[0_0_0_3px_rgba(75,0,133,.16)]"
          />
        </div>
      )}
      <div className="-mx-1 flex-1 space-y-[7px] overflow-y-auto px-1 pb-1">
        {resultados.length === 0 && <p className="py-6 text-center text-sm text-[#8F82A0]">Ninguém encontrado.</p>}
        {resultados.map((p) => {
          const on = modo === "multipla" ? !!selecionados?.includes(p.cpf) : selecionado === p.cpf
          return (
            <button
              key={p.cpf}
              type="button"
              onClick={() => onSelecionar(p.cpf)}
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
              {modo === "multipla" ? (
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px]"
                  style={{ background: on ? GRAD : "#F1EBF8", color: on ? "#fff" : "#CFC4DA" }}
                >
                  <Check className="h-[15px] w-[15px]" />
                </span>
              ) : (
                on && (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-white" style={{ background: GRAD }}>
                    <Check className="h-[15px] w-[15px]" />
                  </span>
                )
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}
