"use client"

import { CheckCircle2, ShieldCheck } from "lucide-react"
import { EPIS, resumoEpis, type ChecklistPayload, type EpiCodigo, type EpiStatus } from "@/lib/formularios/regras"
import type { Erros } from "./ChecklistWizard"
import { GRAD, MensagemErro } from "./ui"

const OPCOES: { valor: EpiStatus; rotulo: string }[] = [
  { valor: "sim", rotulo: "Sim" },
  { valor: "na", rotulo: "N/A" },
  { valor: "nao", rotulo: "Não" },
]

function estilo(ativo: boolean, valor: EpiStatus): React.CSSProperties {
  if (!ativo) return { background: "transparent", color: "#8F82A0" }
  if (valor === "sim") return { background: GRAD, color: "#fff", boxShadow: "0 8px 18px -10px rgba(75,0,133,.9)" }
  if (valor === "na") return { background: "#fff", color: "#4B0085", boxShadow: "0 1px 3px rgba(26,11,46,.12)" }
  return { background: "#C42B2B", color: "#fff", boxShadow: "0 8px 18px -10px rgba(196,43,43,.9)" }
}

export function EtapaEpis({
  epis,
  qtdOperadores,
  erros,
  onMarcar,
}: {
  epis: ChecklistPayload["epis"]
  qtdOperadores: number
  erros: Erros
  onMarcar: (codigo: EpiCodigo, valor: EpiStatus | null) => void
}) {
  return (
    <div className="space-y-3.5">
      <div
        className="flex items-start gap-[11px] rounded-[20px] p-[14px_15px] text-[12px] leading-[1.5] text-[#4B0085]"
        style={{ border: "1px solid rgba(124,58,237,.18)", background: "linear-gradient(135deg, rgba(244,240,251,.95), rgba(255,255,255,.7))" }}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] text-white" style={{ background: GRAD }}>
          <ShieldCheck className="h-4 w-4" />
        </span>
        <p>
          <strong className="font-bold">Verificação da equipe.</strong> Vale para os {qtdOperadores} operadores da lista.
        </p>
      </div>
      <div className="space-y-[9px]">
        {EPIS.map((e) => (
          <div
            key={e.codigo}
            className="flex items-center gap-2.5 rounded-[18px] border border-white/60 bg-white/72 px-3 py-[11px] shadow-[0_10px_26px_-22px_rgba(75,0,133,.5)] backdrop-blur-[20px]"
          >
            <span className="min-w-0 flex-1 text-[13px] font-semibold text-[#201429]">{e.nome}</span>
            <span className="flex gap-1 rounded-[13px] bg-[#F1EBF8] p-[3px]">
              {OPCOES.map((o) => {
                const ativo = epis[e.codigo] === o.valor
                return (
                  <button
                    key={o.valor}
                    type="button"
                    onClick={() => onMarcar(e.codigo, ativo ? null : o.valor)}
                    className="h-[34px] min-w-[44px] rounded-[10px] px-2 text-[11px] font-bold transition"
                    style={estilo(ativo, o.valor)}
                  >
                    {o.rotulo}
                  </button>
                )
              })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-2xl bg-[#F4F0FB] px-3.5 py-3 text-xs font-semibold text-[#4B0085]">
        <CheckCircle2 className="h-[15px] w-[15px]" /> {resumoEpis(epis)}
      </div>
      <MensagemErro texto={erros.epis} />
    </div>
  )
}
