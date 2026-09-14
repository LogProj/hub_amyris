import { createHmac } from "node:crypto"

// Identificador OPACO de pessoa, para o CPF nunca sair do servidor (nem para o
// navegador, nem para o rascunho no aparelho). É um HMAC: estável entre
// requisições e instâncias, mas não permite voltar ao CPF. O servidor resolve o
// id recalculando-o para cada pessoa da SRA do momento.
const SEGREDO =
  process.env.FORMULARIOS_ID_SECRET ||
  process.env.AUTH_API_KEY ||
  "hub-amyris-formularios-dev" // só para desenvolvimento/testes

export function idDaPessoa(cpf: string): string {
  return createHmac("sha256", SEGREDO).update(cpf).digest("base64url").slice(0, 16)
}
