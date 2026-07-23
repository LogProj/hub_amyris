"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Menu, X, Search, LogOut, UserRound } from "lucide-react"

import { cn } from "@/lib/utils"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"

type Sessao = {
  user: { name: string | null; email: string }
  authorization: { isAdmin: boolean; nome: string | null }
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [drawer, setDrawer] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [sessao, setSessao] = useState<Sessao | null>(null)

  // Busca a sessão no mount; sem sessão válida, volta ao login.
  useEffect(() => {
    let ativo = true
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (res) => {
        if (!ativo) return
        if (res.status === 401) {
          router.replace("/login")
          return
        }
        if (res.ok) setSessao((await res.json()) as Sessao)
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [router])

  const isAdmin = sessao?.authorization.isAdmin ?? false
  const nome = sessao?.authorization.nome ?? sessao?.user.name ?? null
  const email = sessao?.user.email ?? null

  // trava o scroll do body quando o drawer mobile está aberto
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [drawer])

  const handleLogout = async () => {
    setSigningOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      /* logout local não depende do servidor */
    }
    router.push("/login")
  }

  return (
    <div className="min-h-dvh bg-amyris-radial">
      {/* Sidebar fixa (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-amyris/10 bg-white/80 backdrop-blur-xl lg:block">
        <DashboardSidebar isAdmin={isAdmin} />
      </aside>

      {/* Drawer (mobile) */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          drawer ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-amyris-ink/40 backdrop-blur-sm transition-opacity duration-300",
            drawer ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setDrawer(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 border-r border-amyris/10 bg-white shadow-soft transition-transform duration-300",
            drawer ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <DashboardSidebar isAdmin={isAdmin} onNavigate={() => setDrawer(false)} />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-amyris/10 bg-white/70 px-4 backdrop-blur-xl sm:px-6">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-amyris hover:bg-amyris-mist lg:hidden"
            onClick={() => setDrawer((v) => !v)}
            aria-label={drawer ? "Fechar menu" : "Abrir menu"}
          >
            {drawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar indicadores, guias…"
              className="h-10 w-full rounded-xl border border-input bg-white/70 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-amyris/40 focus:ring-2 focus:ring-amyris/20"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl border border-amyris/10 bg-white/70 px-3 py-1.5 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amyris-grad text-white">
                <UserRound className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <p className="max-w-[160px] truncate text-xs font-semibold text-foreground">
                  {nome ?? email ?? "Carregando…"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isAdmin ? "Administrador" : email ? "Acesso ao sistema" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={signingOut}
              className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-foreground/70 transition-colors hover:bg-amyris-mist hover:text-amyris disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{signingOut ? "Saindo…" : "Sair"}</span>
            </button>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  )
}
