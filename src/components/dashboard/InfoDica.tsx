"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Info } from "lucide-react"

/**
 * Ícone de informação com um balão curto explicando um indicador/gráfico.
 * Uso: <InfoDica texto="O que este gráfico mostra..." /> ao lado do título.
 */
export function InfoDica({ texto, titulo }: { texto: string; titulo?: string }) {
  const [aberto, setAberto] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)
  const id = useId()

  useEffect(() => {
    if (!aberto) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setAberto(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [aberto])

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="O que este indicador mostra"
        aria-expanded={aberto}
        aria-controls={id}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-amyris-mist hover:text-amyris focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amyris/30"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {aberto && (
        <span
          id={id}
          role="tooltip"
          className="animate-fade-up absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-amyris/10 bg-white p-3 text-left shadow-soft"
        >
          {titulo && <span className="block text-xs font-semibold text-amyris-ink">{titulo}</span>}
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{texto}</span>
        </span>
      )}
    </span>
  )
}
