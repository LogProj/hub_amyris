import { NextRequest, NextResponse } from "next/server"
import { getCurrentSession } from "@/lib/auth-session"
import { proximaRotaSegura } from "@/lib/rota-segura"

// Rotaciona a sessão (Route Handler PODE gravar cookies) e volta para `next`.
// Usado pelo layout de /dashboards quando o access token expira mas ainda há
// refresh token — Server Components não podem rotacionar cookies.
export async function GET(request: NextRequest) {
  const nextParam = request.nextUrl.searchParams.get("next")
  // evita open redirect: só caminhos internos (mesma validação usada no pós-login)
  const destino = proximaRotaSegura(nextParam, "/dashboards")

  const sessao = await getCurrentSession() // valida + rotaciona/limpa cookies
  return NextResponse.redirect(new URL(sessao ? destino : "/login", request.url))
}
