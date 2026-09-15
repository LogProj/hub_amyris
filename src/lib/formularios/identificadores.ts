import { createHmac } from "node:crypto"

// Identificador OPACO de pessoa, para o CPF nunca sair do servidor (nem para o
// navegador, nem para o rascunho no aparelho). É um HMAC: estável entre
// requisições e instâncias, mas não permite voltar ao CPF. O servidor resolve o
// id recalculando-o para cada pessoa da SRA do momento.
//
// Defina FORMULARIOS_ID_SECRET explicitamente (não dependa só do fallback para
// AUTH_API_KEY): como AUTH_API_KEY também é usado para outra coisa (autenticação),
// girar essa chave mudaria silenciosamente todos os ids opacos já em uso.
const SEGREDO_ENV = process.env.FORMULARIOS_ID_SECRET || process.env.AUTH_API_KEY

// Falha alto em produção se nenhum segredo estiver configurado: sem isso, os ids
// virariam HMAC sob uma chave constante e conhecida (a de dev abaixo), o que é
// enumerável de volta ao CPF — anulando o propósito do id opaco. Em dev/test o
// fallback constante mantém o módulo utilizável sem configuração extra.
if (!SEGREDO_ENV && process.env.NODE_ENV === "production") {
  throw new Error("FORMULARIOS_ID_SECRET (ou AUTH_API_KEY) é obrigatório em produção")
}

const SEGREDO = SEGREDO_ENV || "hub-amyris-formularios-dev" // só para desenvolvimento/testes

export function idDaPessoa(cpf: string): string {
  return createHmac("sha256", SEGREDO).update(cpf).digest("base64url").slice(0, 16)
}
