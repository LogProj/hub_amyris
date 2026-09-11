"use client"

import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, ClipboardList, Home, LogOut } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [saindo, setSaindo] = useState(false)

  async function sair() {
    setSaindo(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      router.replace("/login")
    }
  }

  const item = "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition"
  const naLista = pathname === "/formularios"

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[430px] gap-1 border-t border-[#EDE4F5] bg-white/95 px-3 pt-2 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur">
      <button type="button" onClick={() => router.back()} className={cn(item, "text-[#8F82A0] hover:bg-[#F4F0FB] hover:text-[#4B0085]")}>
        <ArrowLeft className="h-5 w-5" /> Voltar
      </button>
      <button type="button" onClick={() => router.push("/dashboards")} className={cn(item, "text-[#8F82A0] hover:bg-[#F4F0FB] hover:text-[#4B0085]")}>
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
    </nav>
  )
}
