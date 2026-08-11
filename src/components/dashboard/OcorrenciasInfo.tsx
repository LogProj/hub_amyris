"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Info, X } from "lucide-react"

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border/70 pt-6">
      <h3 className="font-display text-base font-semibold text-foreground">{titulo}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Item({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-semibold text-foreground">{titulo}</dt>
      <dd className="mt-0.5 text-muted-foreground">{children}</dd>
    </div>
  )
}

/** Botão de informação: o que o painel de Controle de Ocorrências mostra. */
export function OcorrenciasInfo() {
  const [aberto, setAberto] = useState(false)
  const fecharRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!aberto) return
    fecharRef.current?.focus()
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      document.removeEventListener("keydown", onKey)
    }
  }, [aberto])

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="O que o painel de ocorrências mostra"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amyris/15 bg-white/70 text-amyris transition-colors hover:bg-amyris-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amyris/30"
      >
        <Info className="h-4 w-4" />
      </button>

      {aberto &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-amyris-ink/40 backdrop-blur-sm"
              onClick={() => setAberto(false)}
              aria-hidden
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ocorrencias-info-titulo"
              className="reveal relative z-10 max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-amyris/10 bg-white p-7 shadow-soft sm:p-9"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="eyebrow">Sobre o painel</span>
                  <h2
                    id="ocorrencias-info-titulo"
                    className="mt-3 font-display text-2xl font-semibold"
                  >
                    O que o Controle de Ocorrências mostra
                  </h2>
                </div>
                <button
                  ref={fecharRef}
                  type="button"
                  onClick={() => setAberto(false)}
                  aria-label="Fechar"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-amyris-mist hover:text-amyris focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amyris/30"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
                <section>
                  <h3 className="font-display text-base font-semibold text-foreground">
                    De onde vêm os números
                  </h3>
                  <p className="mt-3 text-muted-foreground">
                    Das <b className="text-foreground">ocorrências de segurança registradas na
                    unidade Barra Bonita</b>. Cada registro guarda o que aconteceu, com quem, em
                    qual turno, a gravidade e a área. O painel mostra sempre o{" "}
                    <b className="text-foreground">mês selecionado</b> — troque o mês no seletor
                    ao lado do título. Alguns gráficos têm um <b className="text-foreground">botão
                    de alternância</b> para trocar o indicador exibido (ex.: Turno ↔ PSIF).
                  </p>
                </section>

                <Secao titulo="Indicadores">
                  <dl className="space-y-3">
                    <Item titulo="Total de ocorrências">
                      quantos registros existem no total para a unidade (todos os meses).
                    </Item>
                    <Item titulo="Ocorrências do mês">
                      quantos registros houve no mês, com a{" "}
                      <b className="text-foreground">variação</b> em relação ao mês anterior
                      (seta para baixo = melhorou, menos ocorrências).
                    </Item>
                    <Item titulo="Com CAT aberta">
                      ocorrências do mês que geraram <b className="text-foreground">CAT</b>{" "}
                      (Comunicação de Acidente de Trabalho).
                    </Item>
                    <Item titulo="Colaboradores">
                      quantas pessoas diferentes apareceram nas ocorrências do mês.
                    </Item>
                    <Item titulo="Por Turno / PSIF (alternável)">
                      concentração por turno do dia; o botão troca para PSIF.
                    </Item>
                    <Item titulo="Classificação GPS / Cliente (alternável)">
                      classificação de gravidade padrão (GPS) e a do cliente — troque pelo botão.
                    </Item>
                    <Item titulo="Parte do Corpo / Negócio (alternável)">
                      partes do corpo atingidas nos casos com lesão; o botão troca para a área da
                      operação (negócio).
                    </Item>
                    <Item titulo="Top colaboradores e Por tipo">
                      as pessoas com mais ocorrências e os tipos mais frequentes, do maior para o
                      menor.
                    </Item>
                    <Item titulo="Calendário e por mês">
                      os dias com mais registros no mês e a evolução mês a mês ao longo do ano.
                    </Item>
                  </dl>

                  <p className="mt-4 rounded-xl bg-amyris-mist/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                    🔢 <b className="text-foreground">Exemplo:</b> se no mês houve{" "}
                    <b className="text-foreground">8 ocorrências</b> e no mês anterior foram{" "}
                    <b className="text-foreground">10</b>, a variação é{" "}
                    <b className="text-foreground">−20%</b> — ou seja, 2 ocorrências a menos.
                  </p>
                </Secao>

                <section className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 text-xs leading-relaxed text-muted-foreground">
                  <b className="text-foreground">Observação:</b> o painel mostra{" "}
                  <b className="text-foreground">exatamente o que foi registrado</b> no controle
                  de ocorrências. Meses sem registro aparecem vazios.
                </section>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
