"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

/**
 * Painel deslizante de baixo para cima. SEMPRE em portal para o body + fixed:
 * dentro dos cards (glass/backdrop-blur) um overlay absolute fica preso atrás
 * dos cards seguintes — ver CLAUDE.md.
 */
export function Sheet({
  aberto,
  titulo,
  subtitulo,
  onFechar,
  children,
}: {
  aberto: boolean
  titulo: string
  subtitulo?: string
  onFechar: () => void
  children: React.ReactNode
}) {
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])

  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar()
    }
    document.addEventListener("keydown", aoTeclar)
    return () => document.removeEventListener("keydown", aoTeclar)
  }, [aberto, onFechar])

  if (!montado || !aberto) return null
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="absolute inset-0 bg-[rgba(26,11,46,.45)] backdrop-blur-[2px]" onClick={onFechar} />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[78dvh] w-full max-w-[430px] flex-col rounded-t-[30px] bg-white px-4 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] shadow-[0_-20px_60px_-20px_rgba(26,11,46,.5)]">
        <span className="mx-auto mb-3 h-1 w-[38px] shrink-0 rounded-full bg-[#E7DEED]" />
        <div className="mb-3 flex shrink-0 items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold text-[#201429]">{titulo}</p>
            {subtitulo && <p className="text-[11px] text-[#6D5E78]">{subtitulo}</p>}
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
        {children}
      </div>
    </div>,
    document.body,
  )
}
