// Valida o destino de redirecionamento pós-login (?next=) contra open redirect.
//
// NÃO basta checar prefixo da string ("//" , "/\\"): o parser de URL do
// navegador remove tab/CR/LF de QUALQUER lugar da string antes de resolver a
// URL, então "/%09/evil.com" passa incólume por um filtro de prefixo e ainda
// assim resolve para https://evil.com ao ser navegado (Next usa `new URL(href,
// location.href)` internamente). A validação correta é: remover os
// caracteres de controle primeiro, e então CONFIRMAR por parsing (não por
// prefixo) que a origem resultante é a mesma do site.
export function proximaRotaSegura(next: string | null, fallback: string = "/"): string {
  if (!next) return fallback
  // tab/CR/LF são removidos pelo parser de URL do navegador e furam a checagem de prefixo
  const limpo = next.replace(/[\t\n\r]/g, "")
  if (!limpo.startsWith("/") || limpo.startsWith("//") || limpo.startsWith("/\\")) return fallback
  try {
    const base = "https://h.invalid"
    const u = new URL(limpo, base)
    if (u.origin !== base) return fallback
    return `${u.pathname}${u.search}${u.hash}`
  } catch {
    return fallback
  }
}
