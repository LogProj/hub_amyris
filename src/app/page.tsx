import { redirect } from "next/navigation"

// A landing (hero) está OCULTA por enquanto. A entrada do sistema vai direto para
// os dashboards. A tela de boas-vindas foi preservada em /home para reativarmos
// depois (basta restaurar este arquivo com o conteúdo de /home).
export default function RootPage() {
  redirect("/dashboards")
}
