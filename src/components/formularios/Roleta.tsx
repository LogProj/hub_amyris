"use client"

import { useEffect, useRef } from "react"

const ALTURA = 40 // altura de cada item, em px
const VISIVEIS = 5 // itens visíveis na janela (ímpar, para ter um centro)

/**
 * Coluna rolável no estilo "roleta": o item que parar no centro é o escolhido.
 * Usa scroll-snap do navegador (sem biblioteca) e também aceita toque direto no item.
 *
 * Evita o loop de retroalimentação entre o efeito de posicionamento e o handler
 * de scroll: o efeito só reposiciona quando o `scrollTop` atual já não está (a
 * mais de 1px) no lugar certo para o `valor` recebido — depois que o próprio
 * scroll assenta num índice e ele já é o `valor`, o efeito não tem nada a fazer.
 */
export function Roleta({
  rotulo,
  itens,
  valor,
  onMudar,
}: {
  rotulo: string
  itens: string[]
  valor: string
  onMudar: (valor: string) => void
}) {
  const refLista = useRef<HTMLDivElement>(null)
  const rolando = useRef<ReturnType<typeof setTimeout> | null>(null)
  const indice = Math.max(0, itens.indexOf(valor))

  // Posiciona a roleta no valor atual (ao abrir, ao tocar num item e quando o valor muda de fora).
  useEffect(() => {
    const lista = refLista.current
    if (!lista) return
    const alvo = indice * ALTURA
    if (Math.abs(lista.scrollTop - alvo) > 1) lista.scrollTop = alvo
  }, [indice])

  // Limpa o timer de debounce do scroll se o componente desmontar antes dele disparar.
  useEffect(() => {
    return () => {
      if (rolando.current) clearTimeout(rolando.current)
    }
  }, [])

  // Ao parar de rolar, o item do centro vira o valor escolhido — uma única vez por parada.
  function aoRolar() {
    const lista = refLista.current
    if (!lista) return
    if (rolando.current) clearTimeout(rolando.current)
    rolando.current = setTimeout(() => {
      rolando.current = null
      const i = Math.min(itens.length - 1, Math.max(0, Math.round(lista.scrollTop / ALTURA)))
      if (itens[i] !== valor) onMudar(itens[i])
    }, 120)
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
    e.preventDefault()
    const passo = e.key === "ArrowDown" ? 1 : -1
    const proximo = Math.min(itens.length - 1, Math.max(0, indice + passo))
    onMudar(itens[proximo])
  }

  const espaco = ((VISIVEIS - 1) / 2) * ALTURA

  return (
    <div className="flex flex-1 flex-col items-center">
      <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A79BB0]">{rotulo}</span>
      <div className="relative w-full" style={{ height: VISIVEIS * ALTURA }}>
        {/* faixa de seleção fixa no centro */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 rounded-[14px] border border-[rgba(124,58,237,.35)] bg-[#F7F3FD]"
          style={{ height: ALTURA }}
        />
        <div
          ref={refLista}
          onScroll={aoRolar}
          onKeyDown={aoTeclar}
          role="listbox"
          aria-label={rotulo}
          tabIndex={0}
          className="relative z-10 h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          <div style={{ height: espaco }} />
          {itens.map((item) => {
            const ativo = item === valor
            return (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={ativo}
                tabIndex={-1}
                onClick={() => onMudar(item)}
                className="flex w-full snap-center items-center justify-center text-[17px] transition"
                style={{
                  height: ALTURA,
                  color: ativo ? "#201429" : "#A79BB0",
                  fontWeight: ativo ? 700 : 500,
                }}
              >
                {item}
              </button>
            )
          })}
          <div style={{ height: espaco }} />
        </div>
      </div>
    </div>
  )
}
