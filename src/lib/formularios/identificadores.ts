import { createHmac } from "node:crypto"

// Identificador OPACO de pessoa, para o CPF nunca sair do servidor (nem para o
// navegador, nem para o rascunho no aparelho). É um HMAC: estável entre
// requisições e instâncias, mas não permite voltar ao CPF. O servidor resolve o
// id recalculando-o para cada pessoa da SRA do momento.
//
// Defina FORMULARIOS_ID_SECRET explicitamente (não dependa só do fallback para
// AUTH_API_KEY): como AUTH_API_KEY também é usado para outra coisa (autenticação),
// girar essa chave mudaria silenciosamente todos os ids opacos já em uso.
//
// O segredo é resolvido em tempo de CHAMADA (dentro da função), não no topo do
// módulo: este arquivo é importado por `sra.ts`, que `carregamento/page.tsx`
// carrega, e o passo "Collecting page data" do `next build` executa esse import
// em build time com NODE_ENV=production — um throw no topo do módulo derrubaria
// o build inteiro (e não só o deploy em runtime) se as variáveis de ambiente do
// passo de build não tiverem o segredo (cenário comum na Vercel: algumas scopes
// de env var só valem em runtime). Mesma convenção de `getApiKeyHeaders` em
// `global-auth.ts`: falha alto por requisição, nunca por import.
function obterSegredo(): string {
  const segredoEnv = process.env.FORMULARIOS_ID_SECRET || process.env.AUTH_API_KEY
  if (!segredoEnv && process.env.NODE_ENV === "production") {
    throw new Error("FORMULARIOS_ID_SECRET (ou AUTH_API_KEY) é obrigatório em produção")
  }
  return segredoEnv || "hub-amyris-formularios-dev" // só para desenvolvimento/testes
}

export function idDaPessoa(cpf: string): string {
  return createHmac("sha256", obterSegredo()).update(cpf).digest("base64url").slice(0, 16)
}
