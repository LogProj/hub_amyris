# No celular, a entrada é o Formulário Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quem entra no hub **pelo celular** cai direto em `/formularios`, em vez de seguir a ordem do registro de telas (que leva à Visão geral).

**Architecture:** Uma função pura `ehCelular(userAgent)` em módulo testável, usada no Server Component da raiz (`src/app/page.tsx`), que já lê `headers()`. Nada muda no login nem no middleware: o middleware já manda `/login` logado para `/`, então a regra vale para todo o fluxo de entrada.

**Tech Stack:** Next.js 14 (App Router) + TypeScript strict + vitest.

**Spec:** `docs/superpowers/specs/2026-09-10-checklist-carregamento-design.md` (seção "Estado atual") — acrescenta a regra de entrada por dispositivo.

## Contexto da decisão (2026-09-15)

Depois do deploy, o usuário observou: *"quando o usuário logar pelo celular, ele deve entrar direto na sessão de formulários"*. Hoje a raiz usa `primeiraTelaPermitida`, que segue a ordem de `HUB_SCREENS` (visao-geral primeiro), então um admin ou alguém com Visão geral cai num painel de desktop mesmo no celular.

Decisões do controlador (comunicadas ao usuário, reversíveis):
- **Tablet conta como celular** — a operação usa os dois no pátio.
- **Vale para todos, inclusive admin** — quem quiser um painel no celular ainda chega digitando o endereço; nenhuma rota é bloqueada por dispositivo.
- **Só vale se a pessoa puder ver `formularios`**; caso contrário, mantém-se o comportamento atual.

## Global Constraints

- A regra é **só de entrada** (`/`). Nenhuma outra rota redireciona por dispositivo, e nada é bloqueado por dispositivo.
- Detecção **server-side**, pelo cabeçalho `user-agent`; nada de redirecionamento no cliente (causaria piscada).
- Sem cookies novos, sem dependência nova, sem mudança de banco. **NUNCA** `prisma db push`/`migrate`.
- Não iniciar nem parar servidores (há um rodando na porta 3000 para o teste do usuário).
- `npm test` + `npx tsc --noEmit` + `npx next build` limpos.
- Commits em português, terminando com as duas linhas de atribuição do dispatch.

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/dispositivo.ts` (+ `.test.ts`) | `ehCelular(userAgent: string \| null): boolean` |
| `src/app/page.tsx` | usa `ehCelular` + `podeVerTela` antes de `primeiraTelaPermitida` |

---

### Task 1: Entrada por dispositivo

**Files:**
- Create: `src/lib/dispositivo.ts`, `src/lib/dispositivo.test.ts`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces: `ehCelular(userAgent: string | null | undefined): boolean` — `true` para celulares e tablets (Android, iPhone, iPad, iPod, Windows Phone, e o `iPadOS` que se apresenta como Macintosh **com** `Mobile`), `false` para desktop, bots e `null`.
- Consumes: `podeVerTela`, `primeiraTelaPermitida` (`@/lib/screens`), `getSessionReadOnly` (`@/lib/auth-session`).

- [ ] **Step 1: Testes (falhando)**

Create `src/lib/dispositivo.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { ehCelular } from "./dispositivo"

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36"
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
const TABLET_ANDROID =
  "Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
const WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

describe("ehCelular", () => {
  it("reconhece celulares", () => {
    expect(ehCelular(IPHONE)).toBe(true)
    expect(ehCelular(ANDROID)).toBe(true)
  })
  it("reconhece tablets", () => {
    expect(ehCelular(IPAD)).toBe(true)
    expect(ehCelular(TABLET_ANDROID)).toBe(true)
  })
  it("não confunde computador com celular", () => {
    expect(ehCelular(WINDOWS)).toBe(false)
    expect(ehCelular(MAC)).toBe(false)
  })
  it("trata ausência de informação como computador", () => {
    expect(ehCelular(null)).toBe(false)
    expect(ehCelular("")).toBe(false)
    expect(ehCelular(undefined)).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- dispositivo`
Expected: FAIL — `Failed to resolve import "./dispositivo"`.

- [ ] **Step 3: Implementar**

Create `src/lib/dispositivo.ts`:

```ts
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
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: A raiz respeita o dispositivo**

Em `src/app/page.tsx`, depois de resolver a sessão e antes do `redirect` final:

```tsx
const { authorization } = resultado.sessao

// No celular, a entrada do hub é o formulário: os painéis são feitos para tela
// grande e a operação no pátio usa o celular só para preencher checklist. Quem
// não tem a tela de Formulários segue a regra normal. Nenhuma rota é bloqueada
// por dispositivo — digitar o endereço de um painel continua funcionando.
if (ehCelular(headers().get("user-agent")) && podeVerTela(authorization, "formularios")) {
  redirect("/formularios")
}

redirect(primeiraTelaPermitida(authorization))
```

Atualizar o comentário do topo do arquivo para mencionar a regra do celular.

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit && npm test && npx next build`
Expected: limpo.

Conferir lendo o código: `/login` logado continua indo para `/` (middleware), então quem entra pelo celular passa pela nova regra sem mudança no login; e o `?next=` continua tendo prioridade (quem clicou num link de painel vai para o painel, mesmo no celular).

- [ ] **Step 7: Commit**

```bash
git add src/lib/dispositivo.ts src/lib/dispositivo.test.ts src/app/page.tsx
git commit -m "feat: no celular, a entrada do hub e o formulario"
```

---

### Task 2: Publicação

- [ ] **Step 1:** `npm test && npx tsc --noEmit && npx next build` na branch.
- [ ] **Step 2:** merge `--no-ff` na `main` e `git push origin main` (a Vercel publica sozinha) — a autorização de deploy do usuário para esta linha de trabalho já está registrada no ledger.
- [ ] **Step 3:** avisar o usuário e pedir a confirmação no celular dele: entrar pelo telefone e conferir que cai em `/formularios`; no computador, nada muda.
