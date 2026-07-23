import type { Metadata } from "next"
import Link from "next/link"
import { Target, HeartHandshake, Gauge, Leaf, ArrowRight } from "lucide-react"

import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { TiltCard } from "@/components/TiltCard"
import { Button } from "@/components/ui/button"
import { InhausLogo } from "@/components/brand/InhausLogo"

export const metadata: Metadata = {
  title: "Sobre a In-Haus",
  description: "A In-Haus desenvolve operação logística inteligente para empresas de biotecnologia.",
}

const VALUES = [
  {
    icon: Target,
    title: "Foco no resultado",
    desc: "Cada indicador existe para gerar decisão. Nada de painel bonito sem propósito.",
  },
  {
    icon: Gauge,
    title: "Precisão na operação",
    desc: "Dados confiáveis, em tempo real, para uma logística que não deixa nada cair.",
  },
  {
    icon: HeartHandshake,
    title: "Parceria de verdade",
    desc: "Trabalhamos lado a lado com a Amyris, como uma extensão do time.",
  },
]

export default function SobrePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-amyris-radial">
      <SiteHeader />
      <main className="flex-1 pt-32">
        {/* Hero da seção — sotaque teal da In-Haus */}
        <section className="mx-auto max-w-7xl px-5 sm:px-8">
          <span className="reveal inline-flex items-center gap-2 rounded-full border border-inhaus/20 bg-inhaus-tint px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-inhaus">
            <Leaf className="h-3.5 w-3.5" />
            Quem desenvolve o hub
          </span>
          <h1 className="reveal delay-1 mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            A <span className="text-inhaus">In-Haus</span> por trás da sua operação logística
          </h1>
          <p className="reveal delay-2 mt-5 max-w-2xl text-lg text-muted-foreground">
            Somos especialistas em transformar operações logísticas complexas em indicadores
            claros e acionáveis. Para a Amyris, isso significa enxergar cada etapa da cadeia
            com a confiança de quem leva biotecnologia a sério.
          </p>
          <div className="reveal delay-3 mt-7">
            <InhausLogo className="h-8" />
          </div>
        </section>

        {/* Valores */}
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {VALUES.map((v) => (
              <TiltCard key={v.title} className="h-full">
                <div className="glass relative h-full rounded-3xl p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-inhaus text-white shadow-[0_14px_30px_-14px_rgba(2,113,147,0.7)]">
                    <v.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-foreground">{v.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </section>

        {/* Faixa de destaque */}
        <section className="px-5 pb-24 sm:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-inhaus/15 bg-gradient-to-br from-inhaus to-inhaus-deep p-10 shadow-[0_30px_80px_-40px_rgba(2,113,147,0.7)] sm:p-16">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Uma operação que você acompanha de perto
              </h2>
              <p className="mt-4 text-white/85">
                Do recebimento à entrega, a In-Haus cuida da logística e devolve para a Amyris
                o que realmente importa: clareza, controle e tranquilidade.
              </p>
              <Button asChild size="lg" className="mt-8 bg-white text-inhaus hover:bg-white/90">
                <Link href="/dashboards">
                  Acessar Dashboards
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
