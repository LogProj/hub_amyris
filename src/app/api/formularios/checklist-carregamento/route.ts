// POST /api/formularios/checklist-carregamento — grava um Checklist de Carregamento.
// Qualquer usuário logado no hub pode enviar. A validação REAL (inclusive cargos de
// supervisor/líder contra a SRA do momento) acontece aqui, não só na tela.
import { NextResponse } from "next/server"

import { requireSession } from "@/lib/auth-session"
import { salvarChecklist } from "@/lib/formularios/checklist"
import { normalizarPayload, validarChecklist, type PessoaSra } from "@/lib/formularios/regras"
import { getPessoasSra } from "@/lib/formularios/sra"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  let bruto: unknown
  try {
    bruto = await request.json()
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 })
  }
  const payload = normalizarPayload(bruto)

  let pessoas: PessoaSra[]
  try {
    pessoas = await getPessoasSra()
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar a escala agora. Tente de novo em instantes." },
      { status: 503 },
    )
  }

  const erros = validarChecklist(payload, pessoas)
  if (erros.length > 0) return NextResponse.json({ erros }, { status: 422 })

  const { authorization } = guard.sessao
  try {
    const id = await salvarChecklist(payload, pessoas, {
      usuarioId: authorization.usuarioId,
      email: authorization.email,
      nome: authorization.nome,
    })
    return NextResponse.json({ id }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Não foi possível salvar o checklist. Seus dados continuam no aparelho; tente enviar de novo." },
      { status: 500 },
    )
  }
}
