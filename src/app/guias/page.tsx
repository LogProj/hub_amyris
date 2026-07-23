import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen, Compass, Ruler, ShieldCheck, ArrowRight, Sparkles } from "lucide-react"

import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { TiltCard } from "@/components/TiltCard"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Guias",
  description: "Guias operacionais, definições de indicadores e padrões da operação logística.",
}

const GUIDES = [
  {
    icon: Compass,
    title: "Primeiros passos",
    desc: "Como navegar pelo hub, acessar dashboards e interpretar a estrutura da operação.",
  },
  {
    icon: Ruler,
    title: "Definição de indicadores",
    desc: "O que significa cada KPI — OTIF, lead time, nível de serviço — e como são calculados.",
  },
  {
    icon: ShieldCheck,
    title: "Padrões e governança",
    desc: "Boas práticas, responsabilidades e os critérios de qualidade da In-Haus.",
  },
]

export default function GuiasPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-amyris-radial">
      <SiteHeader />
      <main className="flex-1 pt-32">
        <section className="mx-auto max-w-7xl px-5 sm:px-8">
          <span className="eyebrow reveal">
            <Sparkles className="h-3.5 w-3.5" />
            Central de conhecimento
          </span>
          <h1 className="reveal delay-1 mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Guias para tirar o <span className="text-gradient">máximo</span> da operação
          </h1>
          <p className="reveal delay-2 mt-5 max-w-2xl text-lg text-muted-foreground">
            Documentação clara e direta sobre indicadores, processos e os padrões da In-Haus.
            O conteúdo será publicado aqui conforme os módulos forem liberados.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {GUIDES.map((g) => (
              <TiltCard key={g.title} className="h-full">
                <div className="glass relative flex h-full flex-col rounded-3xl p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amyris-grad text-white shadow-glow">
                    <g.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-foreground">{g.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{g.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground/70">
                    <BookOpen className="h-4 w-4" /> Em breve
                  </span>
                </div>
              </TiltCard>
            ))}
          </div>

          <div className="mt-12 overflow-hidden rounded-[2rem] border border-amyris/10 bg-white/70 p-10 backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Precisa de algo específico?
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Enquanto publicamos os guias, fale com o time da In-Haus — ajudamos a destravar
                qualquer dúvida da operação.
              </p>
            </div>
            <Button asChild variant="gradient" size="lg" className="mt-6 sm:mt-0">
              <Link href="/sobre">
                Falar com a In-Haus
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
