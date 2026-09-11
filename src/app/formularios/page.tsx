import Link from "next/link"
import { ChevronRight, ClipboardCheck, HardHat, History, Lock, ShieldAlert, Sparkles, Truck } from "lucide-react"
import { GRAD } from "@/components/formularios/ui"

const EM_BREVE = [
  { grupo: "Ronda", titulo: "Inspeção Veicular", icone: ClipboardCheck },
  { grupo: "Segurança", titulo: "Inspeção de EPI", icone: HardHat },
  { grupo: "Segurança", titulo: "Registro de Ocorrência", icone: ShieldAlert },
]

export default function FormulariosPage() {
  return (
    <div className="space-y-6 pt-2">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F0FB] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4B0085]">
          <Sparkles className="h-3.5 w-3.5" /> Registros da operação
        </span>
        <h1 className="mt-3 font-display text-[26px] font-semibold tracking-tight text-[#201429]">Formulários</h1>
        <p className="mt-1 text-sm text-[#6B5E7B]">
          Escolha o registro que vai preencher. Os dados alimentam os indicadores do hub.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8F82A0]">Disponível agora</p>
        <Link
          href="/formularios/carregamento"
          className="relative flex items-center gap-3.5 overflow-hidden rounded-[26px] border border-white/60 bg-[rgba(255,255,255,.72)] p-[18px] text-left shadow-[0_1px_0_rgba(255,255,255,.6)_inset,0_18px_50px_-24px_rgba(75,0,133,.4)] backdrop-blur-[24px] transition motion-safe:animate-pulse-glow active:scale-[.985]"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[26px]"
            style={{ background: "radial-gradient(420px circle at 12% 0%, rgba(124,58,237,.14), transparent 62%)" }}
          />
          <span
            className="relative grid h-12 w-12 flex-none place-items-center rounded-[16px] text-white shadow-[0_10px_24px_-12px_rgba(75,0,133,.7)]"
            style={{ background: GRAD }}
          >
            <Truck className="h-[22px] w-[22px]" />
          </span>
          <span className="relative flex min-w-0 flex-1 flex-col gap-[3px]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7C3AED]">Ronda</span>
            <span className="font-display text-[17px] font-semibold tracking-[-0.01em] text-[#201429]">Carregamento</span>
            <span className="text-xs text-[#6D5E78]">Equipe, EPIs, veículo e lacres</span>
          </span>
          <span className="relative grid h-[34px] w-[34px] flex-none place-items-center rounded-xl bg-[#F4F0FB] text-[#4B0085]">
            <ChevronRight className="h-[18px] w-[18px]" />
          </span>
        </Link>
        <Link
          href="/formularios/historico"
          className="flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold text-[#4B0085] hover:bg-[#F4F0FB]"
        >
          <History className="h-4 w-4" /> Histórico de envios
        </Link>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8F82A0]">Em breve</p>
        {EM_BREVE.map(({ grupo, titulo, icone: Icone }) => (
          <div key={titulo} className="flex items-center gap-3 rounded-[22px] border border-[#EDE4F5] bg-white/70 p-4 opacity-80">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F4F0FB] text-[#A99BBB]">
              <Icone className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A99BBB]">{grupo}</span>
              <span className="font-display font-semibold text-[#5B4E6B]">{titulo}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F0FB] px-2 py-1 text-[10px] font-semibold text-[#8F82A0]">
              <Lock className="h-3 w-3" /> Em breve
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
