import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionReadOnly } from "@/lib/auth-session"
import { ehCelular } from "@/lib/dispositivo"
import { podeVerTela, primeiraTelaPermitida } from "@/lib/screens"

// A landing (hero) está OCULTA por enquanto. A entrada do sistema manda a pessoa
// direto para a primeira tela que ela pode ver (registro em HUB_SCREENS) — assim
// quem só tem Formulários não cai numa tela de dashboard bloqueada. Admin continua
// caindo na Visão geral, que é a primeira do registro. No celular (e tablet), a
// entrada é direto o Formulário — os painéis são feitos para tela grande e a
// operação no pátio usa o celular só para preencher checklist — desde que a pessoa
// tenha essa tela liberada; senão segue a regra normal. A tela de boas-vindas foi
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

  const { authorization } = resultado.sessao

  // No celular, a entrada do hub é o formulário: os painéis são feitos para tela
  // grande e a operação no pátio usa o celular só para preencher checklist. Quem
  // não tem a tela de Formulários segue a regra normal. Nenhuma rota é bloqueada
  // por dispositivo — digitar o endereço de um painel continua funcionando.
  if (ehCelular(headers().get("user-agent")) && podeVerTela(authorization, "formularios")) {
    redirect("/formularios")
  }

  redirect(primeiraTelaPermitida(authorization))
}
