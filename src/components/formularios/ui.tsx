import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export const GRAD = "linear-gradient(135deg,#4B0085 0%,#7C3AED 55%,#A78BFA 100%)"

export const classeInput =
  "h-[46px] w-full rounded-[14px] border border-[#E7DEED] bg-white px-3 text-[15px] text-[#201429] outline-none transition placeholder:text-[#B5A9C4] focus:border-[rgba(75,0,133,.5)] focus:shadow-[0_0_0_3px_rgba(75,0,133,.16)]"

export function Cartao({
  icone: Icone,
  titulo,
  subtitulo,
  extra,
  children,
}: {
  icone: LucideIcon
  titulo: string
  subtitulo?: string
  extra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[24px] border border-[#EDE4F5] bg-white p-4 shadow-[0_1px_2px_rgba(26,11,46,.04),0_12px_28px_-18px_rgba(75,0,133,.25)]">
      <header className="mb-3 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F4F0FB] text-[#4B0085]">
          <Icone className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-semibold text-[#201429]">{titulo}</p>
          {subtitulo && <p className="text-xs text-[#8F82A0]">{subtitulo}</p>}
        </div>
        {extra}
      </header>
      {children}
    </section>
  )
}

export function MensagemErro({ texto }: { texto?: string }) {
  if (!texto) return null
  return <p className="mt-1.5 text-xs font-medium text-[#C42B2B]">{texto}</p>
}

export function Campo({ rotulo, erro, children }: { rotulo: string; erro?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#5B4E6B]">{rotulo}</span>
      {children}
      <MensagemErro texto={erro} />
    </label>
  )
}

export function Pilula({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full bg-[#F4F0FB] px-2.5 py-1 text-xs font-semibold text-[#4B0085]", className)}
      {...props}
    />
  )
}
