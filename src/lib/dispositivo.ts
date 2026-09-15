// Detecção de celular/tablet pelo user-agent, feita no SERVIDOR (o redirecionamento
// de entrada precisa acontecer antes de renderizar, sem piscar a tela).
// Proposital: tablet conta como celular — a operação usa os dois no pátio.
// "Android" sem "Mobile" é tablet Android; iPadOS moderno se apresenta como
// Macintosh, mas mantém "Mobile" no user-agent.
const CELULAR = /Android|iPhone|iPad|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i

export function ehCelular(userAgent: string | null | undefined): boolean {
  const ua = userAgent ?? ""
  if (!ua) return false
  if (CELULAR.test(ua)) return true
  // iPadOS 13+ em modo desktop: "Macintosh" + "Mobile".
  return /Macintosh/i.test(ua) && /Mobile/i.test(ua)
}
