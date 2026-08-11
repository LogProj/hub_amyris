import type { Metadata } from "next"
import nextDynamic from "next/dynamic"
import { AlertTriangle, ShieldCheck, Activity, UserX, CalendarX } from "lucide-react"

import { MonthFilter } from "@/components/dashboard/MonthFilter"
import { getSessionReadOnly } from "@/lib/auth-session"
import { getEpiData, type EpiData } from "@/lib/epi"

const EpiAderenciaChart = nextDynamic(() =>
  import("@/components/dashboard/EpiCharts").then((m) => m.EpiAderenciaChart),
)
const EpiConformidadeChart = nextDynamic(() =>
  import("@/components/dashboard/EpiCharts").then((m) => m.EpiConformidadeChart),
)

export const metadata: Metadata = { title: "EPI" }
export const dynamic = "force-dynamic"

function dataBR(iso: string) {
  const [a, m, d] = iso.split("-")
  return `${d}/${m}/${a}`
}

export default async function EpiPage({ searchParams }: { searchParams: { mes?: string } }) {
  // Gate por papel: admin ou quem tem a tela "epi" concedida.
  const s = await getSessionReadOnly()
  const auth = s.status === "ok" ? s.sessao.authorization : null
  const podeVer = Boolean(auth?.isAdmin || auth?.visibleScreens?.includes("epi"))
  if (!podeVer) {
    return (
      <div className="mt-8 rounded-2xl border border-amyris/10 bg-amyris-mist/50 p-6 text-sm text-muted-foreground">
        Você não tem acesso a este painel. Peça a um administrador para conceder a tela <strong>EPI</strong>.
      </div>
    )
  }

  let data: EpiData | null = null
  let erro: string | null = null
  try {
    data = await getEpiData(searchParams.mes)
  } catch (e) {
    erro = e instanceof Error ? e.message : "Falha ao consultar o EPI."
  }

  return (
    <div className="w-full">
      <div className="reveal flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Segurança</span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Utilização de EPIs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aderência e ocorrências do mês {data ? `— ${data.crLabel}` : ""}.
          </p>
        </div>
        {data && <MonthFilter meses={data.meses} atual={data.mesAtual} basePath="/dashboards/epi" />}
      </div>

      {erro ? (
        <div role="alert" className="mt-8 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Não foi possível carregar o painel de EPI.</p>
            <p className="mt-1 text-destructive/80">{erro}</p>
          </div>
        </div>
      ) : data ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icone={Activity} rotulo="Aderência do mês" valor={`${data.kpis.aderencia}%`} detalhe={`${data.kpis.preenchidos} de ${data.kpis.esperados} esperados`} />
            <Kpi icone={ShieldCheck} rotulo="Não conformidades" valor={data.kpis.naoConformidades} detalhe="ocorrências" />
            <Kpi icone={UserX} rotulo="Ausências" valor={data.kpis.ausencias} detalhe="no mês" />
            <Kpi icone={CalendarX} rotulo="Dias pendentes" valor={data.kpis.diasPendentes} detalhe="sem registro" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <section className="reveal glass flex flex-col rounded-2xl p-5">
              <h2 className="font-display text-lg font-semibold">Aderência ao longo do mês</h2>
              <p className="text-xs text-muted-foreground">Preenchimentos feitos ÷ esperados, por dia</p>
              <div className="mt-4">
                {data.porDia.length ? <EpiAderenciaChart data={data.porDia} /> : <Vazio texto="Sem preenchimentos no mês." />}
              </div>
            </section>

            <section className="reveal delay-1 glass flex flex-col rounded-2xl p-5">
              <h2 className="font-display text-lg font-semibold">Conformidade</h2>
              <p className="text-xs text-muted-foreground">Preenchimentos conformes × não conformes</p>
              <div className="mt-4">
                {data.conformidade.conformes + data.conformidade.naoConformes > 0 ? (
                  <EpiConformidadeChart conformes={data.conformidade.conformes} naoConformes={data.conformidade.naoConformes} />
                ) : (
                  <Vazio texto="Nenhum preenchimento no mês." />
                )}
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Lista titulo="Não conformidades" vazio="Nenhuma no período." total={data.naoConformidades.length}>
              {data.naoConformidades.map((n, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                  <span className="min-w-[160px] flex-1 font-medium">{n.nome}</span>
                  <span className="text-amyris">{n.epis.join(", ") || "EPI"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{dataBR(n.data)}</span>
                </li>
              ))}
            </Lista>

            <Lista titulo="Ausências" vazio="Nenhuma ausência no período." total={data.ausencias.length}>
              {data.ausencias.map((a, i) => (
                <li key={i} className="flex items-center gap-2 py-2 text-sm">
                  <span className="flex-1 font-medium">{a.nome}</span>
                  <span className="text-xs text-muted-foreground">{dataBR(a.data)}</span>
                </li>
              ))}
            </Lista>
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-amyris/10 bg-amyris-mist/50 p-6 text-sm text-muted-foreground">
          Nenhum dado de EPI encontrado.
        </div>
      )}
    </div>
  )
}

function Kpi({ icone: Icone, rotulo, valor, detalhe }: { icone: React.ComponentType<{ className?: string }>; rotulo: string; valor: string | number; detalhe: string }) {
  return (
    <div className="reveal glass rounded-2xl p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icone className="h-4 w-4 text-amyris" /> {rotulo}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold text-amyris">{valor}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{detalhe}</p>
    </div>
  )
}

function Lista({ titulo, vazio, total, children }: { titulo: string; vazio: string; total: number; children: React.ReactNode }) {
  return (
    <section className="reveal delay-1 glass flex flex-col rounded-2xl p-5">
      <h2 className="font-display text-lg font-semibold">
        {titulo}
        {total > 0 && <span className="ml-2 rounded-full bg-amyris-mist px-2 py-0.5 text-xs font-medium text-amyris">{total}</span>}
      </h2>
      {total === 0 ? <p className="mt-3 text-sm text-muted-foreground">{vazio}</p> : <ul className="mt-2 divide-y divide-amyris/5">{children}</ul>}
    </section>
  )
}

function Vazio({ texto }: { texto: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{texto}</p>
}
