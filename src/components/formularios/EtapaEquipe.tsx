"use client"

import { useState } from "react"
import { CalendarClock, Plus, Users, X } from "lucide-react"
import { formatarDataHora } from "@/lib/formularios/calendario"
import { formatarFuncao, iniciais, type PessoaSra } from "@/lib/formularios/regras"
import type { Erros } from "./ChecklistWizard"
import { CampoSeletor } from "./CampoSeletor"
import { DataHoraSheet } from "./DataHoraSheet"
import { Campo, Cartao, MensagemErro, Pilula } from "./ui"

export function EtapaEquipe({
  operadores,
  inicioEm,
  fimEm,
  erros,
  onRemover,
  onAbrirBusca,
  onMudar,
}: {
  operadores: PessoaSra[]
  inicioEm: string
  fimEm: string
  erros: Erros
  onRemover: (cpf: string) => void
  onAbrirBusca: () => void
  onMudar: (campo: "inicioEm" | "fimEm", valor: string) => void
}) {
  const [painel, setPainel] = useState<"inicio" | "fim" | null>(null)

  return (
    <div className="space-y-4">
      <Cartao icone={Users} titulo="Operadores" subtitulo="Da escala da SRA" extra={<Pilula>{operadores.length}</Pilula>}>
        <div className="space-y-2">
          {operadores.map((o) => (
            <div key={o.cpf} className="flex items-center gap-2.5 rounded-2xl border border-[#E7DEED] bg-white py-2.5 pl-3 pr-2.5">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] bg-[#F4F0FB] text-[11px] font-bold text-[#4B0085]">
                {iniciais(o.nome)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-semibold text-[#201429]">{o.nome}</span>
                <span className="truncate text-[10px] text-[#6D5E78]">{formatarFuncao(o.funcao)}</span>
              </span>
              <button
                type="button"
                onClick={() => onRemover(o.cpf)}
                aria-label={`Remover ${o.nome}`}
                className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] text-[#A79BB0] hover:bg-[rgba(217,45,45,.08)] hover:text-[#C42B2B]"
              >
                <X className="h-[15px] w-[15px]" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onAbrirBusca}
            className="flex h-[46px] w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[rgba(124,58,237,.42)] bg-[rgba(244,240,251,.7)] text-[13px] font-semibold text-[#4B0085] hover:border-[#7C3AED] hover:bg-[#F4F0FB]"
          >
            <Plus className="h-[17px] w-[17px]" /> Adicionar operador
          </button>
          <MensagemErro texto={erros.operadores} />
        </div>
      </Cartao>

      <Cartao icone={CalendarClock} titulo="Período da atividade" subtitulo="Data e hora de início e fim">
        <div className="grid gap-3">
          <Campo rotulo="Data/hora início" erro={erros.inicioEm}>
            <CampoSeletor
              valor={formatarDataHora(inicioEm) || null}
              placeholder="Escolher data e hora"
              icone={CalendarClock}
              onAbrir={() => setPainel("inicio")}
              invalido={!!erros.inicioEm}
            />
          </Campo>
          <Campo rotulo="Data/hora fim" erro={erros.fimEm}>
            <CampoSeletor
              valor={formatarDataHora(fimEm) || null}
              placeholder="Escolher data e hora"
              icone={CalendarClock}
              onAbrir={() => setPainel("fim")}
              invalido={!!erros.fimEm}
            />
          </Campo>
        </div>
      </Cartao>

      <DataHoraSheet
        aberto={painel === "inicio"}
        titulo="Início do carregamento"
        valor={inicioEm}
        onConfirmar={(v) => onMudar("inicioEm", v)}
        onFechar={() => setPainel(null)}
      />
      <DataHoraSheet
        aberto={painel === "fim"}
        titulo="Fim do carregamento"
        valor={fimEm}
        onConfirmar={(v) => onMudar("fimEm", v)}
        onFechar={() => setPainel(null)}
      />
    </div>
  )
}
