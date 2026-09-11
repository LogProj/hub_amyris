import { UserRound } from "lucide-react"
import { AmyrisLogo } from "@/components/brand/AmyrisLogo"
import { nomeCurto } from "@/lib/formularios/regras"
import { GRAD } from "./ui"
import { BottomNav } from "./BottomNav"
import { NAV_HEIGHT } from "./navMetrics"

// Respiro extra além da altura da nav: cobre a barra de CTA fixa que o wizard do
// Checklist de Carregamento desenha por cima do conteúdo (ver ChecklistWizard.tsx),
// para o último card da página nunca ficar escondido atrás dela + da nav.
const MAIN_BOTTOM_PAD = `calc(${NAV_HEIGHT} + 96px)`

export function MobileShell({ nome, children }: { nome: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#EFE9F7]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#FBF9FE]">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[rgba(75,0,133,.08)] bg-white/60 px-5 pt-[max(env(safe-area-inset-top),16px)] pb-4 backdrop-blur-[20px]">
          <div className="flex items-center gap-2">
            <AmyrisLogo className="h-6" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8F82A0]">Hub</span>
          </div>
          <span className="inline-flex h-10 items-center gap-2 rounded-full border border-[rgba(75,0,133,.1)] bg-white/70 pl-1 pr-3 text-xs font-semibold text-[#201429]">
            <span
              className="grid h-8 w-8 place-items-center rounded-full text-white"
              style={{ background: GRAD }}
            >
              <UserRound className="h-3.5 w-3.5" />
            </span>
            {nomeCurto(nome)}
          </span>
        </header>
        <main className="flex-1 px-5" style={{ paddingBottom: MAIN_BOTTOM_PAD }}>
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
