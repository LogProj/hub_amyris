import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { AmyrisLogo } from "@/components/brand/AmyrisLogo"
import { getSessionReadOnly } from "@/lib/auth-session"
import { SairButton } from "./SairButton"

export const metadata: Metadata = { title: "Sem acesso" }
export const dynamic = "force-dynamic"

// Página de aviso para quem tem sessão válida mas nenhuma tela liberada ainda.
// Sem sidebar de propósito: a pessoa não tem para onde navegar dentro do hub.
export default async function SemAcessoPage() {
  const resultado = await getSessionReadOnly()
  if (resultado.status === "anonimo") redirect("/login")
  if (resultado.status === "renovar") {
    const path = headers().get("x-invoke-path") ?? "/sem-acesso"
    redirect(`/api/auth/refresh?next=${encodeURIComponent(path)}`)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-amyris-radial px-5 py-12 text-center">
      <AmyrisLogo className="h-8" />
      <h1 className="mt-8 font-display text-2xl font-semibold tracking-tight text-foreground">
        Seu acesso ainda não foi liberado
      </h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Peça a um administrador para liberar as telas que você precisa.
      </p>
      <SairButton />
    </div>
  )
}
