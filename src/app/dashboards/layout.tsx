import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { getCurrentSession } from "@/lib/auth-session"

export default async function DashboardsLayout({ children }: { children: React.ReactNode }) {
  const sessao = await getCurrentSession()
  if (!sessao) redirect("/login")

  return <DashboardShell>{children}</DashboardShell>
}
