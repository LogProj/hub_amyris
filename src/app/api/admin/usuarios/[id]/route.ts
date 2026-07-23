// /api/admin/usuarios/[id] — alterna admin/acesso e revoga acesso (delete).
// "Revogar" remove só o ACESSO local; a identidade no global_auth permanece.
import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { sanitizeScreens } from "@/lib/screens"

export const dynamic = "force-dynamic"

function parseId(id: string): number | null {
  const n = Number(id)
  return Number.isInteger(n) && n > 0 ? n : null
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const id = parseId(params.id)
  if (id === null) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  let body: { isAdmin?: boolean; hasAccess?: boolean; nome?: string; visibleScreens?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 })
  }

  const alvo = await prisma.authUser.findUnique({ where: { id } })
  if (!alvo) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  // Trava anti-lockout: o admin não pode remover o próprio papel/acesso.
  const ehProprio = id === guard.sessao.authorization.usuarioId
  if (ehProprio && (body.isAdmin === false || body.hasAccess === false)) {
    return NextResponse.json(
      { error: "Você não pode remover o próprio acesso de administrador." },
      { status: 400 },
    )
  }

  const atualizado = await prisma.authUser.update({
    where: { id },
    data: {
      ...(body.nome !== undefined ? { name: body.nome?.trim() || null } : {}),
      ...(body.isAdmin !== undefined ? { isAdmin: body.isAdmin } : {}),
      ...(body.hasAccess !== undefined ? { hasAccess: body.hasAccess } : {}),
      ...(body.visibleScreens !== undefined ? { visibleScreens: sanitizeScreens(body.visibleScreens) } : {}),
    },
  })

  return NextResponse.json({
    usuario: {
      localId: atualizado.id,
      authUserId: atualizado.authUserId,
      email: atualizado.email,
      nome: atualizado.name,
      type: null,
      isActiveGlobal: true,
      lastLoginAt: atualizado.lastLoginAt ? atualizado.lastLoginAt.toISOString() : null,
      comAcesso: atualizado.hasAccess,
      isAdmin: atualizado.isAdmin,
      vinculado: atualizado.authUserId !== null,
      cpf: null,
      visibleScreens: atualizado.visibleScreens,
    },
  })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const id = parseId(params.id)
  if (id === null) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  if (id === guard.sessao.authorization.usuarioId) {
    return NextResponse.json({ error: "Você não pode revogar o próprio acesso." }, { status: 400 })
  }

  const alvo = await prisma.authUser.findUnique({ where: { id } })
  if (!alvo) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  // Revoga o acesso local (mantém a linha para histórico de vínculo).
  await prisma.authUser.update({ where: { id }, data: { hasAccess: false, isAdmin: false } })
  return NextResponse.json({ ok: true })
}
