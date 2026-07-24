import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { getSessionReadOnly } from "@/lib/auth-session"

export default async function DashboardsLayout({ children }: { children: React.ReactNode }) {
  // Server Component não pode gravar cookies — usa a checagem somente leitura.
  const resultado = await getSessionReadOnly()

  if (resultado.status === "anonimo") redirect("/login")
  if (resultado.status === "renovar") {
    // access expirado com refresh válido: rotaciona na rota de API e volta.
    const path = headers().get("x-invoke-path") ?? "/dashboards"
    redirect(`/api/auth/refresh?next=${encodeURIComponent(path)}`)
  }

  return <DashboardShell>{children}</DashboardShell>
}
