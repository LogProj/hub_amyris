"use client"

import type { LucideIcon } from "lucide-react"
import { ChevronDown } from "lucide-react"

/** Botão com a mesma aparência de um campo (classeInput), que abre um painel. */
export function CampoSeletor({
  valor,
  placeholder,
  icone: Icone,
  onAbrir,
  invalido = false,
}: {
  valor: string | null
  placeholder: string
  icone?: LucideIcon
  onAbrir: () => void
  invalido?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      className="flex h-[46px] w-full items-center gap-2.5 rounded-[14px] border bg-white px-3 text-left text-[13px] transition"
      style={{ borderColor: invalido ? "rgba(196,43,43,.5)" : "#E7DEED" }}
    >
      {Icone && <Icone className="h-[17px] w-[17px] shrink-0 text-[#7C3AED]" />}
      <span className={`min-w-0 flex-1 truncate ${valor ? "font-semibold text-[#201429]" : "text-[#A79BB0]"}`}>
        {valor || placeholder}
      </span>
      <ChevronDown className="h-[17px] w-[17px] shrink-0 text-[#6D5E78]" />
    </button>
  )
}
