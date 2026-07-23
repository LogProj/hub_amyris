// /api/admin/usuarios — lista todos os usuários do global_auth (com o estado de
// acesso local) e CRIA um novo: identidade no global_auth + acesso local.
import { NextResponse } from "next/server"

import { getAccessTokenFromCookies, requireAdmin } from "@/lib/auth-session"
import {
  GlobalAuthError,
  createGlobalAuthUser,
  listGlobalAuthUsers,
  normalizeEmail,
} from "@/lib/global-auth"
import { prisma } from "@/lib/prisma"
import { sanitizeScreens } from "@/lib/screens"
import type { UsuarioAdminRow } from "@/lib/admin-types"

export const dynamic = "force-dynamic"

type LocalRow = {
  id: number
  authUserId: string | null
  email: string
  name: string | null
  isAdmin: boolean
  hasAccess: boolean
  visibleScreens: string[]
  lastLoginAt: Date | null
}

function fromLocal(u: LocalRow): UsuarioAdminRow {
  return {
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
    visibleScreens: u.visibleScreens ?? [],
  }
}

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  let locais: LocalRow[] = []
  let dbError: string | undefined
  try {
    locais = (await prisma.authUser.findMany({
      orderBy: [{ hasAccess: "desc" }, { email: "asc" }],
    })) as LocalRow[]
  } catch {
    dbError = "Banco local indisponível — concessões de acesso não serão persistidas até configurar o DATABASE_URL."
  }
  const localPorEmail = new Map(locais.map((u) => [u.email.toLowerCase(), u]))

  // Lê todos os usuários do global_auth. Se falhar, degrada para só os locais.
  const accessToken = getAccessTokenFromCookies()
  let globais: Awaited<ReturnType<typeof listGlobalAuthUsers>> = []
  let globalAuthError: string | undefined
  if (accessToken) {
    try {
      globais = await listGlobalAuthUsers(accessToken)
    } catch (err) {
      globalAuthError =
        err instanceof Error ? err.message : "Não foi possível listar os usuários do global_auth."
    }
  } else {
    globalAuthError = "Sessão sem token de acesso para consultar o global_auth."
  }

  const usados = new Set<string>()
  const usuarios: UsuarioAdminRow[] = globais.map((g) => {
    const email = g.email.toLowerCase()
    usados.add(email)
    const local = localPorEmail.get(email)
    return {
      localId: local?.id ?? null,
      authUserId: g.id ?? local?.authUserId ?? null,
      email: g.email,
      nome: local?.name ?? g.name ?? null,
      type: g.type ?? null,
      isActiveGlobal: g.isActive,
      lastLoginAt: g.lastLoginAt ?? (local?.lastLoginAt ? local.lastLoginAt.toISOString() : null),
      comAcesso: local?.hasAccess ?? false,
      isAdmin: local?.isAdmin ?? false,
      vinculado: (local?.authUserId ?? null) !== null,
      cpf: g.cpf ?? null,
      visibleScreens: local?.visibleScreens ?? [],
    }
  })

  // Usuários com acesso local que não vieram do global_auth (ou se o global falhou).
  for (const local of locais) {
    if (!usados.has(local.email.toLowerCase())) usuarios.push(fromLocal(local))
  }

  return NextResponse.json({ usuarios, globalAuthError: globalAuthError ?? dbError })
}

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  let body: {
    nome?: string
    email?: string
    cpf?: string
    senha?: string
    isAdmin?: boolean
    visibleScreens?: string[]
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 })
  }

  const email = body.email ? normalizeEmail(body.email) : ""
  const nome = body.nome?.trim() ?? ""
  const cpf = (body.cpf ?? "").replace(/\D/g, "")
  const senha = body.senha ?? ""
  const visibleScreens = sanitizeScreens(body.visibleScreens)

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 })
  }
  if (!nome) return NextResponse.json({ error: "Informe o nome." }, { status: 400 })
  if (cpf.length !== 11) {
    return NextResponse.json({ error: "Informe um CPF válido (11 dígitos)." }, { status: 400 })
  }
  if (senha.length < 6) {
    return NextResponse.json({ error: "A senha deve ter ao menos 6 caracteres." }, { status: 400 })
  }

  const existente = await prisma.authUser.findUnique({ where: { email } })
  if (existente && existente.hasAccess) {
    return NextResponse.json({ error: "Já existe um usuário com acesso a esse e-mail." }, { status: 409 })
  }

  // Cria a IDENTIDADE no global_auth (CPF + senha obrigatórios lá).
  let authUserId: string | null = null
  try {
    const ga = await createGlobalAuthUser({ name: nome, email, cpf, password: senha, type: "INTERNAL" })
    authUserId = ga.id
  } catch (err) {
    // Se já existir no global_auth, seguimos só concedendo o acesso local.
    const jaExiste =
      err instanceof GlobalAuthError && (err.status === 409 || /exist|já|cadastr|duplic/i.test(err.message))
    if (!jaExiste) {
      const status = err instanceof GlobalAuthError ? err.status : 500
      const message = err instanceof Error ? err.message : "Falha ao cadastrar no global_auth."
      return NextResponse.json({ error: message }, { status })
    }
  }

  const criado = await prisma.authUser.upsert({
    where: { email },
    update: {
      name: nome,
      authUserId: authUserId ?? undefined,
      hasAccess: true,
      isAdmin: !!body.isAdmin,
      visibleScreens,
    },
    create: { email, name: nome, authUserId, hasAccess: true, isAdmin: !!body.isAdmin, visibleScreens },
  })

  const usuario: UsuarioAdminRow = {
    localId: criado.id,
    authUserId: criado.authUserId,
    email: criado.email,
    nome: criado.name,
    type: "INTERNAL",
    isActiveGlobal: true,
    lastLoginAt: null,
    comAcesso: criado.hasAccess,
    isAdmin: criado.isAdmin,
    vinculado: criado.authUserId !== null,
    cpf,
    visibleScreens: criado.visibleScreens,
  }
  return NextResponse.json({ usuario }, { status: 201 })
}
