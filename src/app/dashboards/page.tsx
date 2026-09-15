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
import { SemAcesso } from "@/components/dashboard/SemAcesso"
import { getSessionReadOnly } from "@/lib/auth-session"
import { getHeadcount, getMesesDisponiveis as getMesesAbsenteismo, getPresencasTimeline } from "@/lib/headcount"
import { getTurnoverData } from "@/lib/turnover"
import { getOcorrenciasData } from "@/lib/ocorrencias"
import { podeVerTela } from "@/lib/screens"

export const metadata: Metadata = { title: "Visão geral" }

// Consulta os indicadores a cada requisição (sem prerender no build).
export const dynamic = "force-dynamic"

type ResumoAbsenteismo = { aderenciaMediaGeral: number; totalFaltas: number } | null
type ResumoTurnover = { quadroAtivoAtual: number; taxaTurnoverPct: number | null } | null
type ResumoOcorrencias = { totalMes: number; comCat: number; colaboradores: number } | null

async function getResumoOcorrencias(): Promise<ResumoOcorrencias> {
  try {
    const data = await getOcorrenciasData()
    return {
      totalMes: data.kpis.totalMes,
      comCat: data.kpis.comCat,
      colaboradores: data.kpis.colaboradores,
    }
  } catch {
    return null
  }
}

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
  const s = await getSessionReadOnly()
  const auth = s.status === "ok" ? s.sessao.authorization : null
  if (!podeVerTela(auth, "visao-geral")) return <SemAcesso tela="Visão geral" />

  const podeAbsenteismo = podeVerTela(auth, "absenteismo")
  const podeTurnover = podeVerTela(auth, "turnover")
  const podeEpi = podeVerTela(auth, "epi")
  const podeOcorrencias = podeVerTela(auth, "ocorrencias")
  const nenhumIndicador = !podeAbsenteismo && !podeTurnover && !podeEpi && !podeOcorrencias

  const [absenteismo, turnover, ocorrencias] = await Promise.all([
    podeAbsenteismo ? getResumoAbsenteismo() : Promise.resolve(null),
    podeTurnover ? getResumoTurnover() : Promise.resolve(null),
    podeOcorrencias ? getResumoOcorrencias() : Promise.resolve(null),
  ])

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

        {nenhumIndicador && (
          <p className="reveal rounded-2xl border border-amyris/10 bg-amyris-mist/50 p-6 text-sm text-muted-foreground">
            Nenhum indicador liberado para você ainda.
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* Absenteísmo */}
          {podeAbsenteismo && (
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
          )}

          {/* Turnover */}
          {podeTurnover && (
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
          )}

          {/* Utilização de EPIs — em breve */}
          {podeEpi && (
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
          )}

          {/* Controle de Ocorrências */}
          {podeOcorrencias && (
          <TiltCard max={5}>
            <Link href="/dashboards/ocorrencias" className="block h-full">
              <div
                className="glass reveal relative h-full overflow-hidden rounded-3xl p-6 transition-shadow hover:shadow-glow"
                style={{ animationDelay: "0.18s" }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amyris-mist text-amyris">
                    <ShieldAlert className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-5 text-sm font-medium text-foreground">Controle de Ocorrências</p>
                {ocorrencias ? (
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-semibold text-foreground">
                      {ocorrencias.totalMes}
                    </span>
                    <span className="text-xs text-muted-foreground">ocorrências no mês</span>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Indicador indisponível</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {ocorrencias
                    ? `${ocorrencias.comCat} com CAT · ${ocorrencias.colaboradores} colaboradores`
                    : "Não foi possível consultar agora"}
                </p>
              </div>
            </Link>
          </TiltCard>
          )}
        </div>
      </section>
    </div>
  )
}
