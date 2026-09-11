import Link from "next/link"
import { History, Plus, Truck } from "lucide-react"
import { Pilula } from "@/components/formularios/ui"
import { listarHistorico, type ItemHistorico } from "@/lib/formularios/checklist"

export const dynamic = "force-dynamic"

const TZ = "America/Sao_Paulo"
const dia = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" })
const hora = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })

function periodo(i: ItemHistorico) {
  const ini = new Date(i.inicioEm)
  const fim = new Date(i.fimEm)
  const mesmoDia = dia.format(ini) === dia.format(fim)
  return mesmoDia
    ? `${dia.format(ini)} · ${hora.format(ini)}–${hora.format(fim)}`
    : `${dia.format(ini)} ${hora.format(ini)} → ${dia.format(fim)} ${hora.format(fim)}`
}

export default async function HistoricoPage() {
  let itens: ItemHistorico[] = []
  let erro = false
  try {
    itens = await listarHistorico(50)
  } catch {
    erro = true
  }

  return (
    <div className="space-y-4 pt-2">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F0FB] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4B0085]">
          <History className="h-3.5 w-3.5" /> Carregamento
        </span>
        <h1 className="mt-3 font-display text-[26px] font-semibold tracking-tight text-[#201429]">Histórico</h1>
        <p className="mt-1 text-sm text-[#6B5E7B]">Últimos 50 checklists enviados por toda a equipe.</p>
      </div>

      {erro && (
        <p className="rounded-xl bg-[rgba(217,45,45,.08)] p-3 text-sm font-medium text-[#C42B2B]">
          Não foi possível carregar o histórico agora. Tente de novo em instantes.
        </p>
      )}

      {!erro && itens.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#D9CCEA] p-6 text-center">
          <p className="text-sm text-[#6B5E7B]">Nenhum checklist enviado ainda.</p>
          <Link href="/formularios/carregamento" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4B0085]">
            <Plus className="h-4 w-4" /> Preencher o primeiro
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {itens.map((i) => (
          <article key={i.id} className="rounded-[24px] border border-[#EDE4F5] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F4F0FB] text-[#4B0085]">
                  <Truck className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="font-display font-semibold text-[#201429]">
                    Veículo {i.veiculoNumero} · {i.veiculoCapacidade}
                  </p>
                  <p className="text-xs text-[#8F82A0]">{periodo(i)}</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#A99BBB]">nº {i.id}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Pilula>{i.qtdOperadores} operadores</Pilula>
              <Pilula>{i.qtdLacres} lacres</Pilula>
              <Pilula className={i.epis.nao > 0 ? "bg-[rgba(217,45,45,.08)] text-[#C42B2B]" : undefined}>
                EPIs: {i.epis.sim} sim · {i.epis.na} N/A · {i.epis.nao} não
              </Pilula>
            </div>
            {i.ocorrencia && <p className="mt-3 rounded-xl bg-[#FBF9FE] p-2.5 text-xs text-[#5B4E6B]">{i.ocorrencia}</p>}
            <p className="mt-3 text-[11px] text-[#8F82A0]">
              Supervisor {i.supervisorNome} · Líder {i.liderNome} · enviado por {i.enviadoPor}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
