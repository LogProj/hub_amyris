"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Info } from "lucide-react"

const LARGURA = 256 // w-64

/**
 * Ícone de informação com um balão curto explicando um indicador/gráfico.
 *
 * IMPORTANTE: o balão é renderizado em PORTAL com posição `fixed` (não `absolute`).
 * Os cards do dashboard usam `glass`/`backdrop-blur`, que criam contexto de
 * empilhamento próprio — um balão `absolute` ficaria PRESO no card e apareceria
 * ATRÁS dos cards seguintes. O portal + fixed garante que ele fique sempre por cima.
 * Ver observação em CLAUDE.md (seção de z-index/overlays).
 */
export function InfoDica({ texto, titulo }: { texto: string; titulo?: string }) {
  const [aberto, setAberto] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const balaoRef = useRef<HTMLDivElement>(null)

  const atualizarRect = useCallback(() => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect())
  }, [])

  useEffect(() => {
    if (!aberto) return
    atualizarRect()
    const onScroll = () => atualizarRect()
    const onResize = () => atualizarRect()
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (balaoRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setAberto(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false)
    }
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onResize)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [aberto, atualizarRect])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="O que este indicador mostra"
        aria-expanded={aberto}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-amyris-mist hover:text-amyris focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amyris/30"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {aberto &&
        rect &&
        createPortal(
          <div
            ref={balaoRef}
            role="tooltip"
            className="animate-fade-up fixed z-[70] rounded-xl border border-amyris/10 bg-white p-3 text-left shadow-soft"
            style={{
              top: rect.bottom + 8,
              left: Math.max(8, Math.min(rect.right - LARGURA, window.innerWidth - LARGURA - 8)),
              width: LARGURA,
            }}
          >
            {titulo && <span className="block text-xs font-semibold text-amyris-ink">{titulo}</span>}
            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{texto}</span>
          </div>,
          document.body,
        )}
    </>
  )
}
