"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Warehouse,
  Target,
  Inbox,
  Send,
  Users,
  HardHat,
  ShieldAlert,
  UserCog,
  Lock,
  RefreshCw,
  LogOut,
  UserRound,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { AmyrisLogo } from "@/components/brand/AmyrisLogo"

type NavItem = {
  href?: string
  label: string
  icon: LucideIcon
  soon?: boolean
}

type NavGroup = { title: string; items: NavItem[] }

const GROUPS: NavGroup[] = [
  {
    title: "Geral",
    items: [{ href: "/dashboards", label: "Visão geral", icon: LayoutDashboard }],
  },
  {
    title: "Almoxarifado",
    items: [
      { label: "Ocupação", icon: Warehouse, soon: true },
      { label: "Acurácia", icon: Target, soon: true },
    ],
  },
  {
    title: "Produtividade",
    items: [
      { label: "Recebimento", icon: Inbox, soon: true },
      { label: "Expedição", icon: Send, soon: true },
    ],
  },
  {
    title: "Gestão",
    items: [
      { href: "/dashboards/absenteismo", label: "Absenteísmo", icon: Users },
      { href: "/dashboards/turnover", label: "Turnover", icon: RefreshCw },
      { href: "/dashboards/epi", label: "EPI", icon: HardHat },
      { href: "/dashboards/ocorrencias", label: "Ocorrências", icon: ShieldAlert },
    ],
  },
]

const ADMIN_GROUP: NavGroup = {
  title: "Administração",
  items: [{ href: "/dashboards/usuarios", label: "Usuários", icon: UserCog }],
}

export function DashboardSidebar({
  onNavigate,
  isAdmin = false,
  nome = null,
  email = null,
  onLogout,
  signingOut = false,
}: {
  onNavigate?: () => void
  isAdmin?: boolean
  nome?: string | null
  email?: string | null
  onLogout?: () => void
  signingOut?: boolean
}) {
  const pathname = usePathname()
  const groups = isAdmin ? [...GROUPS, ADMIN_GROUP] : GROUPS

  return (
    <div className="flex h-full flex-col gap-6 px-4 py-6">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex flex-col items-center justify-center gap-1.5 px-2"
        aria-label="Início"
      >
        <AmyrisLogo className="h-8" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Hub
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = item.href ? pathname === item.href : false
                const content = (
                  <span
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      item.soon
                        ? "cursor-default text-muted-foreground/60"
                        : active
                          ? "bg-amyris-grad text-white shadow-[0_10px_24px_-12px_rgba(75,0,133,0.7)]"
                          : "text-foreground/75 hover:bg-amyris-mist hover:text-amyris",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-transform",
                        !item.soon && !active && "group-hover:scale-110",
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.soon && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <Lock className="h-2.5 w-2.5" /> Em breve
                      </span>
                    )}
                  </span>
                )

                return (
                  <li key={item.label}>
                    {item.href ? (
                      <Link href={item.href} onClick={onNavigate}>
                        {content}
                      </Link>
                    ) : (
                      <div aria-disabled>{content}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-amyris/10 pt-4">
        <div className="flex items-center gap-2 rounded-xl border border-amyris/10 bg-white/70 px-3 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amyris-grad text-white">
            <UserRound className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-xs font-semibold text-foreground">
              {nome ?? email ?? "Carregando…"}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {isAdmin ? "Administrador" : email ? "Acesso ao sistema" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          disabled={signingOut}
          className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-foreground/70 transition-colors hover:bg-amyris-mist hover:text-amyris disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? "Saindo…" : "Sair"}
        </button>
      </div>
    </div>
  )
}
