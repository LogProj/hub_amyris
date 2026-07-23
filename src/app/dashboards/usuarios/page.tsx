import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getCurrentSession } from "@/lib/auth-session"
import { UsuariosAdmin } from "@/components/admin/UsuariosAdmin"

export const metadata: Metadata = { title: "Usuários" }
export const dynamic = "force-dynamic"

export default async function UsuariosPage() {
  let session = null
  try {
    session = await getCurrentSession()
  } catch {
    session = null
  }

  if (!session) redirect("/login")
  if (!session.authorization.isAdmin) redirect("/dashboards")

  return <UsuariosAdmin />
}
