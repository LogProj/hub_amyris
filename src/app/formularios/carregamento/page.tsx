import { ChecklistWizard } from "@/components/formularios/ChecklistWizard"
import { getSessionReadOnly } from "@/lib/auth-session"
import type { PessoaSra } from "@/lib/formularios/regras"
import { getPessoasSra } from "@/lib/formularios/sra"

export const dynamic = "force-dynamic"

export default async function CarregamentoPage() {
  const sessao = await getSessionReadOnly()
  const a = sessao.status === "ok" ? sessao.sessao.authorization : null
  const usuarioChave = a ? String(a.usuarioId || a.email) : "anonimo"

  let pessoas: PessoaSra[] = []
  let erroSra = false
  try {
    pessoas = await getPessoasSra()
  } catch (erro) {
    console.error("checklist wizard SRA:", erro)
    erroSra = true
  }
  return <ChecklistWizard pessoas={pessoas} usuarioChave={usuarioChave} erroSra={erroSra} />
}
