import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionReadOnly } from "@/lib/auth-session"
import { primeiraTelaPermitida } from "@/lib/screens"

// A landing (hero) está OCULTA por enquanto. A entrada do sistema manda a pessoa
// direto para a primeira tela que ela pode ver (registro em HUB_SCREENS) — assim
// quem só tem Formulários não cai numa tela de dashboard bloqueada. Admin continua
// caindo na Visão geral, que é a primeira do registro. A tela de boas-vindas foi
// preservada em /home para reativarmos depois (basta restaurar este arquivo com o
// conteúdo de /home).
export const dynamic = "force-dynamic"

export default async function RootPage() {
  const resultado = await getSessionReadOnly()

  if (resultado.status === "anonimo") redirect("/login")
  if (resultado.status === "renovar") {
    // access expirado com refresh válido: rotaciona na rota de API e volta pra raiz.
    const path = headers().get("x-invoke-path") ?? "/"
    redirect(`/api/auth/refresh?next=${encodeURIComponent(path)}`)
  }

  redirect(primeiraTelaPermitida(resultado.sessao.authorization))
}
