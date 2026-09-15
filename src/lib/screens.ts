// Registro ÚNICO das telas do hub que podem ser concedidas por usuário
// (autorização LOCAL deste projeto — nunca no global_auth). Cada entrada é uma rota
// real da sidebar (DashboardSidebar). Itens "em breve" (sem rota) não entram aqui.
//
// Admin sempre enxerga TODAS as telas, independente do que está salvo no banco.

export type HubScreen = {
  key: string // salvo em AuthUser.visibleScreens
  label: string
  href: string
}

export const HUB_SCREENS: HubScreen[] = [
  { key: "visao-geral", label: "Visão geral", href: "/dashboards" },
  { key: "absenteismo", label: "Absenteísmo", href: "/dashboards/absenteismo" },
  { key: "turnover", label: "Turnover", href: "/dashboards/turnover" },
  { key: "epi", label: "EPI", href: "/dashboards/epi" },
  { key: "ocorrencias", label: "Controle de Ocorrências", href: "/dashboards/ocorrencias" },
  { key: "formularios", label: "Formulários", href: "/formularios" },
]

export const HUB_SCREEN_KEYS = HUB_SCREENS.map((s) => s.key)

export function sanitizeScreens(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const valid = new Set(HUB_SCREEN_KEYS)
  return Array.from(new Set(input.filter((v): v is string => typeof v === "string" && valid.has(v))))
}

/**
 * Telas deste hub vindas da tela de administração + as de outros hubs, que este
 * projeto não conhece e não deve apagar.
 *
 * `auth_users` é uma tabela COMPARTILHADA entre vários hubs (hub_bridgestone,
 * hub_fleury, hub_qssma…). Um usuário pode carregar chaves de tela que este
 * projeto desconhece. Ao salvar as telas deste hub, preserva qualquer chave já
 * existente que não pertença a HUB_SCREEN_KEYS.
 */
export function mesclarTelas(existentes: string[] | null | undefined, novas: unknown): string[] {
  const desteHub = sanitizeScreens(novas)
  const conhecidas = new Set(HUB_SCREEN_KEYS)
  const deOutrosHubs = Array.isArray(existentes)
    ? existentes.filter((v): v is string => typeof v === "string" && !conhecidas.has(v))
    : []
  return Array.from(new Set([...desteHub, ...deOutrosHubs]))
}

export type AcessoUsuario = { isAdmin: boolean; visibleScreens: string[] } | null

/** Admin vê tudo; os demais só o que foi concedido. Sem sessão, nada. */
export function podeVerTela(auth: AcessoUsuario, key: string): boolean {
  if (!auth) return false
  return auth.isAdmin || (auth.visibleScreens ?? []).includes(key)
}

/** Para onde mandar a pessoa ao entrar: a primeira tela que ela pode ver. */
export function primeiraTelaPermitida(auth: AcessoUsuario): string {
  const tela = HUB_SCREENS.find((s) => podeVerTela(auth, s.key))
  return tela?.href ?? "/sem-acesso"
}
