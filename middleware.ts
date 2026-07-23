// PRIMEIRA camada de defesa (defesa em profundidade) — checagem BARATA, só olha a
// PRESENÇA do cookie de sessão; não toca no banco nem valida o token. É apenas uma
// otimização de UX (evita renderizar a rota para quem obviamente não tem cookie).
// A validação REAL (token válido no global_auth + autorização local) acontece
// server-side no layout protegido (src/app/dashboards/layout.tsx via
// getCurrentSession) e nas rotas via requireSession/requireAdmin. NUNCA confie
// só neste middleware para proteger uma rota.
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const COOKIE_PREFIX = "amyris"
const ACCESS_COOKIE = `${COOKIE_PREFIX}_access_token`
const REFRESH_COOKIE = `${COOKIE_PREFIX}_refresh_token`

// Prefixos de rota que exigem sessão.
const protectedRoutes = ["/dashboards"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const temSessao = request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE)

  const ehProtegida = protectedRoutes.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  )

  if (ehProtegida && !temSessao) {
    const url = new URL("/login", request.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // Já logado tentando abrir /login → manda para o app.
  if (pathname === "/login" && temSessao) {
    return NextResponse.redirect(new URL("/dashboards", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboards/:path*", "/login"],
}
