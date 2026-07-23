// /api/admin/usuarios/conceder — concede ACESSO LOCAL a um usuário que JÁ existe no
// global_auth. Não cria identidade (nada é escrito no global_auth): só faz upsert da
// linha em auth_users com hasAccess = true.
import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/auth-session"
import { normalizeEmail } from "@/lib/global-auth"
import { prisma } from "@/lib/prisma"
import type { UsuarioAdminRow } from "@/lib/admin-types"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  let body: { authUserId?: string; email?: string; nome?: string; isAdmin?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 })
  }

  const email = body.email ? normalizeEmail(body.email) : ""
  const nome = body.nome?.trim() || null
  const authUserId = body.authUserId?.trim() || null

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 })
  }

  const u = await prisma.authUser.upsert({
    where: { email },
    update: {
      ...(authUserId ? { authUserId } : {}),
      ...(nome ? { name: nome } : {}),
      hasAccess: true,
      ...(body.isAdmin !== undefined ? { isAdmin: body.isAdmin } : {}),
    },
    create: {
      email,
      name: nome,
      authUserId,
      hasAccess: true,
      isAdmin: !!body.isAdmin,
    },
  })

  const usuario: UsuarioAdminRow = {
    localId: u.id,
    authUserId: u.authUserId,
    email: u.email,
    nome: u.name,
    type: null,
    isActiveGlobal: true,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    comAcesso: u.hasAccess,
    isAdmin: u.isAdmin,
    vinculado: u.authUserId !== null,
    cpf: null,
    visibleScreens: u.visibleScreens,
  }
  return NextResponse.json({ usuario }, { status: 201 })
}
