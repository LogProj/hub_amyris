import type { Metadata } from "next"
import Link from "next/link"
import { Activity, Timer, PackageCheck, Boxes, ArrowUpRight, Sparkles } from "lucide-react"

import { TiltCard } from "@/components/TiltCard"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Visão geral" }

const PLACEHOLDERS = [
  { icon: Activity, label: "Nível de serviço", hint: "% de pedidos no prazo" },
  { icon: Timer, label: "Lead time médio", hint: "Da coleta à entrega" },
  { icon: PackageCheck, label: "OTIF", hint: "On time, in full" },
  { icon: Boxes, label: "Acuracidade de estoque", hint: "Inventário x sistema" },
]

export default function DashboardsHome() {
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
        <Button asChild variant="outline">
          <Link href="/guias">
            Ver guias
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Placeholders de métricas */}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {PLACEHOLDERS.map((m, i) => (
          <TiltCard key={m.label} max={5}>
            <div
              className="glass reveal relative h-full overflow-hidden rounded-3xl p-6"
              style={{ animationDelay: `${0.06 * (i + 1)}s` }}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amyris-mist text-amyris">
                  <m.icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Em breve
                </span>
              </div>
              <p className="mt-5 text-sm font-medium text-foreground">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.hint}</p>
              {/* barra-esqueleto */}
              <div className="mt-4 h-2 w-2/3 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/2 rounded-full bg-amyris-grad opacity-40" />
              </div>
            </div>
          </TiltCard>
        ))}
      </section>

      {/* Estado vazio principal */}
      <section className="reveal overflow-hidden rounded-[2rem] border border-amyris/10 bg-white/70 p-10 text-center backdrop-blur sm:p-16">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amyris-grad text-white shadow-glow">
          <Activity className="h-8 w-8" />
        </div>
        <h2 className="mx-auto mt-6 max-w-xl font-display text-2xl font-semibold tracking-tight text-foreground">
          Os indicadores estão a caminho
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Estamos preparando os dashboards da operação logística. Enquanto isso, explore os
          guias para conhecer as definições e os padrões da In-Haus.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="gradient">
            <Link href="/guias">Explorar guias</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/sobre">Conhecer a In-Haus</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
