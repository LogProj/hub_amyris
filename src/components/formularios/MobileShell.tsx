import { UserRound } from "lucide-react"
import { AmyrisLogo } from "@/components/brand/AmyrisLogo"
import { nomeCurto } from "@/lib/formularios/regras"
import { BottomNav } from "./BottomNav"

export function MobileShell({ nome, children }: { nome: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#EFE9F7]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#FBF9FE]">
        <header className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3">
          <div className="flex items-center gap-2">
            <AmyrisLogo className="h-6" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8F82A0]">Hub</span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#EDE4F5] bg-white py-1 pl-1 pr-3 text-xs font-semibold text-[#201429]">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#F4F0FB] text-[#4B0085]">
              <UserRound className="h-3.5 w-3.5" />
            </span>
            {nomeCurto(nome)}
          </span>
        </header>
        <main className="flex-1 px-5 pb-40">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}
