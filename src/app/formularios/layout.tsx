import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { MobileShell } from "@/components/formularios/MobileShell"
import { getSessionReadOnly } from "@/lib/auth-session"

export default async function FormulariosLayout({ children }: { children: React.ReactNode }) {
  // Server Component não grava cookies — mesma checagem somente leitura dos dashboards.
  const resultado = await getSessionReadOnly()
  if (resultado.status === "anonimo") redirect("/login?next=/formularios")
  if (resultado.status === "renovar") {
    const path = headers().get("x-invoke-path") ?? "/formularios"
    redirect(`/api/auth/refresh?next=${encodeURIComponent(path)}`)
  }
  const { authorization } = resultado.sessao
  return <MobileShell nome={authorization.nome ?? authorization.email}>{children}</MobileShell>
}
