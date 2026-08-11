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
]

export const HUB_SCREEN_KEYS = HUB_SCREENS.map((s) => s.key)

export function sanitizeScreens(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const valid = new Set(HUB_SCREEN_KEYS)
  return Array.from(new Set(input.filter((v): v is string => typeof v === "string" && valid.has(v))))
}
