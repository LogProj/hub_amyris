import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowUpRight,
  Sparkles,
  Users,
  RefreshCw,
  HardHat,
  ShieldAlert,
  Lock,
} from "lucide-react"

import { TiltCard } from "@/components/TiltCard"
import { getHeadcount, getMesesDisponiveis as getMesesAbsenteismo, getPresencasTimeline } from "@/lib/headcount"
import { getTurnoverData } from "@/lib/turnover"

export const metadata: Metadata = { title: "Visão geral" }

// Consulta os indicadores a cada requisição (sem prerender no build).
export const dynamic = "force-dynamic"

type ResumoAbsenteismo = { aderenciaMediaGeral: number; totalFaltas: number } | null
type ResumoTurnover = { quadroAtivoAtual: number; taxaTurnoverPct: number | null } | null

async function getResumoAbsenteismo(): Promise<ResumoAbsenteismo> {
  try {
    const meses = await getMesesAbsenteismo()
    const mes = meses[0]
    if (!mes) return null
    const [headcount, timeline] = await Promise.all([getHeadcount(mes), getPresencasTimeline(mes)])
    return { aderenciaMediaGeral: timeline.aderenciaMediaGeral, totalFaltas: headcount.totalFaltas }
  } catch {
    return null
  }
}

async function getResumoTurnover(): Promise<ResumoTurnover> {
  try {
    const data = await getTurnoverData()
    return {
      quadroAtivoAtual: data.kpis.quadroAtivoAtual,
      taxaTurnoverPct: data.kpis.taxaTurnoverPct,
    }
  } catch {
    return null
  }
}

export default async function DashboardsHome() {
  const [absenteismo, turnover] = await Promise.all([getResumoAbsenteismo(), getResumoTurnover()])

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Cabeçalho */}
      <section className="reveal flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            Painel da operação
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Bem-vindo ao Amyris Hub
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Este é o ambiente onde os indicadores da operação logística vão viver. A
            estrutura está pronta — os KPIs entram em breve.
          </p>
        </div>
      </section>

      {/* Indicadores do hub */}
      <section className="space-y-4">
        <div className="reveal">
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
            Indicadores
          </h2>
          <p className="text-sm text-muted-foreground">Resumo do mês corrente por indicador.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* Absenteísmo */}
          <TiltCard max={5}>
            <Link href="/dashboards/absenteismo" className="block h-full">
              <div className="glass reveal relative h-full overflow-hidden rounded-3xl p-6 transition-shadow hover:shadow-glow">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amyris-mist text-amyris">
                    <Users className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-5 text-sm font-medium text-foreground">Absenteísmo</p>
                {absenteismo ? (
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-semibold text-foreground">
                      {absenteismo.aderenciaMediaGeral}%
                    </span>
                    <span className="text-xs text-muted-foreground">aderência média</span>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Indicador indisponível</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {absenteismo ? `${absenteismo.totalFaltas} faltas no mês` : "Não foi possível consultar agora"}
                </p>
              </div>
            </Link>
          </TiltCard>

          {/* Turnover */}
          <TiltCard max={5}>
            <Link href="/dashboards/turnover" className="block h-full">
              <div
                className="glass reveal relative h-full overflow-hidden rounded-3xl p-6 transition-shadow hover:shadow-glow"
                style={{ animationDelay: "0.06s" }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amyris-mist text-amyris">
                    <RefreshCw className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-5 text-sm font-medium text-foreground">Turnover</p>
                {turnover ? (
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-semibold text-foreground">
                      {turnover.quadroAtivoAtual}
                    </span>
                    <span className="text-xs text-muted-foreground">quadro ativo</span>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Indicador indisponível</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {!turnover
                    ? "Não foi possível consultar agora"
                    : turnover.taxaTurnoverPct == null
                      ? "Sem quadro registrado no mês"
                      : `${turnover.taxaTurnoverPct}% de turnover no mês`}
                </p>
              </div>
            </Link>
          </TiltCard>

          {/* Utilização de EPIs — em breve */}
          <TiltCard max={5}>
            <div
              className="glass reveal relative h-full overflow-hidden rounded-3xl p-6"
              style={{ animationDelay: "0.12s" }}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amyris-mist text-amyris">
                  <HardHat className="h-5 w-5" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Lock className="h-2.5 w-2.5" /> Em breve
                </span>
              </div>
              <p className="mt-5 text-sm font-medium text-foreground">Utilização de EPIs</p>
              <p className="text-xs text-muted-foreground">Uso correto de equipamentos de proteção</p>
            </div>
          </TiltCard>

          {/* Ocorrências — em breve */}
          <TiltCard max={5}>
            <div
              className="glass reveal relative h-full overflow-hidden rounded-3xl p-6"
              style={{ animationDelay: "0.18s" }}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amyris-mist text-amyris">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Lock className="h-2.5 w-2.5" /> Em breve
                </span>
              </div>
              <p className="mt-5 text-sm font-medium text-foreground">Ocorrências</p>
              <p className="text-xs text-muted-foreground">Registro e acompanhamento de ocorrências</p>
            </div>
          </TiltCard>
        </div>
      </section>
    </div>
  )
}
