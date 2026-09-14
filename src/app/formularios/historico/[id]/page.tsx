import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarClock, HardHat, Lock, MessageSquareWarning, Truck, UserCheck, Users } from "lucide-react"
import { Cartao, Pilula } from "@/components/formularios/ui"
import { obterChecklist } from "@/lib/formularios/checklist"
import { formatarFuncao, iniciais } from "@/lib/formularios/regras"

export const dynamic = "force-dynamic"

const TZ = "America/Sao_Paulo"
const dataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const ROTULO_EPI: Record<string, { texto: string; cor: string; fundo: string }> = {
  sim: { texto: "Sim", cor: "#1B7A4B", fundo: "rgba(27,122,75,.10)" },
  na: { texto: "N/A", cor: "#4B0085", fundo: "#F4F0FB" },
  nao: { texto: "Não", cor: "#C42B2B", fundo: "rgba(196,43,43,.10)" },
}

export default async function DetalheChecklistPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id) || id < 1) notFound()

  let item
  try {
    item = await obterChecklist(id)
  } catch {
    return (
      <div className="pt-6">
        <p className="rounded-xl bg-[rgba(217,45,45,.08)] p-3 text-sm font-medium text-[#C42B2B]">
          Não foi possível abrir este checklist agora. Tente de novo em instantes.
        </p>
      </div>
    )
  }
  if (!item) notFound()

  return (
    <div className="space-y-3.5 pt-2">
      <div>
        <Link href="/formularios/historico" className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4B0085]">
          <ArrowLeft className="h-3.5 w-3.5" /> Histórico
        </Link>
        <h1 className="mt-3 font-display text-[26px] font-semibold tracking-tight text-[#201429]">
          Carregamento nº {item.id}
        </h1>
        <p className="mt-1 text-sm text-[#6B5E7B]">Enviado por {item.enviadoPor} em {dataHora.format(new Date(item.enviadoEm))}.</p>
      </div>

      <Cartao icone={CalendarClock} titulo="Período" subtitulo="Início e fim do carregamento">
        <div className="space-y-1 text-[13px] text-[#201429]">
          <p><span className="text-[#6D5E78]">Início:</span> {dataHora.format(new Date(item.inicioEm))}</p>
          <p><span className="text-[#6D5E78]">Fim:</span> {dataHora.format(new Date(item.fimEm))}</p>
        </div>
      </Cartao>

      <Cartao icone={Users} titulo="Equipe" subtitulo={`${item.operadores.length} operadores`}>
        <div className="space-y-2">
          {item.operadores.map((o, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-2xl border border-[#E7DEED] bg-white py-2.5 pl-3 pr-2.5">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] bg-[#F4F0FB] text-[11px] font-bold text-[#4B0085]">
                {iniciais(o.nome)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-semibold text-[#201429]">{o.nome}</span>
                <span className="truncate text-[10px] text-[#6D5E78]">{formatarFuncao(o.funcao)}</span>
              </span>
            </div>
          ))}
        </div>
      </Cartao>

      <Cartao icone={HardHat} titulo="EPIs" subtitulo="Verificação da equipe">
        <div className="divide-y divide-[#F1EBF8]">
          {item.epis.map((e) => {
            const r = ROTULO_EPI[e.status] ?? ROTULO_EPI.na
            return (
              <div key={e.codigo} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-[13px] font-semibold text-[#201429]">{e.nome}</span>
                <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ color: r.cor, background: r.fundo }}>
                  {r.texto}
                </span>
              </div>
            )
          })}
        </div>
      </Cartao>

      <Cartao icone={Truck} titulo="Veículo" subtitulo={`Nº ${item.veiculoNumero} · ${item.veiculoCapacidade}`}>
        <div className="flex flex-wrap gap-1.5">
          {item.lacres.length === 0 && <p className="text-[13px] text-[#6D5E78]">Sem lacres registrados.</p>}
          {item.lacres.map((l, i) => (
            <Pilula key={i} className="border border-[#E7DEED] bg-white">
              <Lock className="mr-1 h-3 w-3" /> {l}
            </Pilula>
          ))}
        </div>
      </Cartao>

      <Cartao icone={UserCheck} titulo="Responsáveis">
        <div className="space-y-1 text-[13px] text-[#201429]">
          <p><span className="text-[#6D5E78]">Supervisor:</span> {item.supervisorNome} · {formatarFuncao(item.supervisorFuncao)}</p>
          <p><span className="text-[#6D5E78]">Líder:</span> {item.liderNome} · {formatarFuncao(item.liderFuncao)}</p>
        </div>
      </Cartao>

      {item.ocorrencia && (
        <Cartao icone={MessageSquareWarning} titulo="Ocorrência">
          <p className="whitespace-pre-wrap text-[13px] text-[#201429]">{item.ocorrencia}</p>
        </Cartao>
      )}
    </div>
  )
}
