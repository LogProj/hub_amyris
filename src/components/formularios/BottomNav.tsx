"use client"

import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, ClipboardList, Home, LogOut } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { NAV_CONTENT_H, NAV_SAFE_PAD } from "./navMetrics"

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [saindo, setSaindo] = useState(false)

  async function sair() {
    setSaindo(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      // Limpa os rascunhos de formulários deste aparelho: eles não devem persistir
      // além da sessão de quem os preencheu.
      try {
        for (const chave of Object.keys(window.localStorage)) {
          if (chave.startsWith("amyris:rascunho:")) window.localStorage.removeItem(chave)
        }
      } catch {}
      router.replace("/login")
    }
  }

  // Altura fixa (NAV_CONTENT_H) em vez de deixar o conteúdo definir o tamanho: assim a
  // altura total da nav é previsível e a barra de CTA do wizard (navMetrics.ts) sabe
  // exatamente quanto espaço reservar acima dela.
  const item = "flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition"
  const naLista = pathname === "/formularios"

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] border-t border-[#EDE4F5] bg-white/95 px-3 backdrop-blur"
      style={{ paddingBottom: NAV_SAFE_PAD }}
    >
      <div className="flex w-full gap-1" style={{ height: NAV_CONTENT_H }}>
        <button type="button" onClick={() => router.back()} className={cn(item, "text-[#8F82A0] hover:bg-[#F4F0FB] hover:text-[#4B0085]")}>
          <ArrowLeft className="h-5 w-5" /> Voltar
        </button>
        <button type="button" onClick={() => router.push("/")} className={cn(item, "text-[#8F82A0] hover:bg-[#F4F0FB] hover:text-[#4B0085]")}>
          <Home className="h-5 w-5" /> Início
        </button>
        <button
          type="button"
          onClick={() => router.push("/formularios")}
          className={cn(item, naLista ? "bg-[#F4F0FB] text-[#4B0085]" : "text-[#8F82A0] hover:bg-[#F4F0FB] hover:text-[#4B0085]")}
        >
          <ClipboardList className="h-5 w-5" /> Formulários
        </button>
        <button
          type="button"
          onClick={sair}
          disabled={saindo}
          className={cn(item, "text-[#8F82A0] hover:bg-[rgba(217,45,45,.08)] hover:text-[#C42B2B] disabled:opacity-60")}
        >
          <LogOut className="h-5 w-5" /> Sair
        </button>
      </div>
    </nav>
  )
}
