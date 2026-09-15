# Governança de telas (Formulários controlável + bloqueio real) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar **Formulários** uma tela concedível na administração e fazer o controle de telas valer de verdade: quem não tem a tela não entra nela nem pela URL, e quem só tem Formulários cai direto nele ao entrar no hub.

**Architecture:** Um único ponto de decisão em `src/lib/screens.ts` (`podeVerTela`, `primeiraTelaPermitida`), um componente de aviso compartilhado (`SemAcesso`), e o gate aplicado em todas as páginas de tela — inclusive nas três que hoje só somem da sidebar. A raiz `/` passa a mandar a pessoa para a primeira tela que ela pode ver.

**Tech Stack:** Next.js 14 (App Router) + TypeScript strict + Tailwind + vitest.

**Spec:** `docs/superpowers/specs/2026-09-10-checklist-carregamento-design.md` (seção "Estado atual") — este increment **muda** a regra "qualquer usuário logado vê o formulário".

## Contexto da decisão (2026-09-14)

O usuário pediu para publicar e para liberar Formulários por usuário na administração, com a condição: *"o usuário que tiver acesso apenas à tela de formulário não pode ver as demais telas"*. Levantamento mostrou que só `epi` e `ocorrencias` conferem `visibleScreens` no servidor; `visao-geral`, `absenteismo` e `turnover` apenas somem da sidebar, então a URL direta abre. O usuário decidiu: **bloquear todas de verdade**, e mandar o usuário só-formulário **direto para `/formularios`**.

## Global Constraints

- `visibleScreens` é autorização **local** deste projeto (nunca no global_auth). **Admin vê tudo**, sempre.
- O gate roda **no servidor** (Server Component), nunca só na sidebar.
- Mensagem de recusa sem termos técnicos, em português, dizendo o que pedir ao administrador.
- Não mexer no fluxo de login/sessão (`auth-session.ts`, cookies, refresh) além do redirecionamento da raiz.
- Não mexer no conteúdo dos indicadores nem no checklist.
- **NUNCA** `prisma db push`/`migrate`; nenhuma mudança de banco (o campo `visibleScreens` já existe).
- `npm test` + `npx tsc --noEmit` + `npx next build` limpos. Não iniciar nem parar servidores (há um rodando na porta 3000).
- Commits em português, terminando com as duas linhas de atribuição do dispatch.

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/screens.ts` (+ `.test.ts`) | registro das telas (+ `formularios`), `podeVerTela`, `primeiraTelaPermitida` |
| `src/components/dashboard/SemAcesso.tsx` | aviso padrão de "sem acesso a esta tela" |
| `src/app/dashboards/page.tsx` | gate `visao-geral` + só mostra cards das telas permitidas |
| `src/app/dashboards/absenteismo/page.tsx` | gate `absenteismo` |
| `src/app/dashboards/turnover/page.tsx` | gate `turnover` |
| `src/app/dashboards/epi/page.tsx`, `.../ocorrencias/page.tsx` | passam a usar o helper e o componente compartilhados |
| `src/app/formularios/layout.tsx` | gate `formularios` |
| `src/app/page.tsx` | raiz manda para a primeira tela permitida |
| `src/components/formularios/BottomNav.tsx` | "Início" vai para `/` (que resolve o destino) |

---

### Task 1: Registro, helpers e aviso compartilhado

**Files:**
- Modify: `src/lib/screens.ts`
- Create: `src/lib/screens.test.ts`, `src/components/dashboard/SemAcesso.tsx`

**Interfaces:**
- `HUB_SCREENS` ganha `{ key: "formularios", label: "Formulários", href: "/formularios" }` (no fim da lista).
- `type AcessoUsuario = { isAdmin: boolean; visibleScreens: string[] } | null`
- `podeVerTela(auth: AcessoUsuario, key: string): boolean` — `true` para admin; `false` para `null`; senão `visibleScreens.includes(key)`.
- `primeiraTelaPermitida(auth: AcessoUsuario): string` — href da primeira tela de `HUB_SCREENS` que a pessoa pode ver; `"/dashboards"` para admin; `"/sem-acesso"` quando não há nenhuma.
- `SemAcesso({ tela }: { tela: string })` — cartão com "Você não tem acesso a esta tela. Peça a um administrador para liberar **{tela}**."

- [ ] **Step 1: Testes (falhando)**

Create `src/lib/screens.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { HUB_SCREENS, podeVerTela, primeiraTelaPermitida, sanitizeScreens } from "./screens"

describe("registro de telas", () => {
  it("inclui Formulários como tela concedível", () => {
    const f = HUB_SCREENS.find((s) => s.key === "formularios")
    expect(f).toEqual({ key: "formularios", label: "Formulários", href: "/formularios" })
  })
  it("aceita a chave nova ao sanear", () => {
    expect(sanitizeScreens(["formularios", "inventada"])).toEqual(["formularios"])
  })
})

describe("podeVerTela", () => {
  it("admin vê tudo", () => {
    expect(podeVerTela({ isAdmin: true, visibleScreens: [] }, "turnover")).toBe(true)
  })
  it("usuário vê só o que foi concedido", () => {
    const auth = { isAdmin: false, visibleScreens: ["formularios"] }
    expect(podeVerTela(auth, "formularios")).toBe(true)
    expect(podeVerTela(auth, "turnover")).toBe(false)
    expect(podeVerTela(auth, "visao-geral")).toBe(false)
  })
  it("sem sessão não vê nada", () => {
    expect(podeVerTela(null, "formularios")).toBe(false)
  })
})

describe("primeiraTelaPermitida", () => {
  it("admin vai para a visão geral", () => {
    expect(primeiraTelaPermitida({ isAdmin: true, visibleScreens: [] })).toBe("/dashboards")
  })
  it("quem só tem formulário vai para o formulário", () => {
    expect(primeiraTelaPermitida({ isAdmin: false, visibleScreens: ["formularios"] })).toBe("/formularios")
  })
  it("segue a ordem do registro quando há várias", () => {
    expect(primeiraTelaPermitida({ isAdmin: false, visibleScreens: ["turnover", "absenteismo"] })).toBe(
      "/dashboards/absenteismo",
    )
  })
  it("sem nenhuma tela, vai para o aviso", () => {
    expect(primeiraTelaPermitida({ isAdmin: false, visibleScreens: [] })).toBe("/sem-acesso")
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- screens`
Expected: FAIL — `podeVerTela is not a function`.

- [ ] **Step 3: Implementar**

Em `src/lib/screens.ts`: acrescentar a entrada `formularios` em `HUB_SCREENS` e, ao fim do arquivo:

```ts
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
```

Create `src/components/dashboard/SemAcesso.tsx` (mesmo visual do aviso que a página de EPI usa hoje):

```tsx
export function SemAcesso({ tela }: { tela: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-amyris/10 bg-amyris-mist/50 p-6 text-sm text-muted-foreground">
      Você não tem acesso a esta tela. Peça a um administrador para liberar <strong>{tela}</strong>.
    </div>
  )
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/screens.ts src/lib/screens.test.ts src/components/dashboard/SemAcesso.tsx
git commit -m "feat: registra Formularios como tela concedivel e centraliza a regra de acesso"
```

---

### Task 2: Bloqueio real em todas as telas

**Files:**
- Modify: `src/app/dashboards/page.tsx`, `src/app/dashboards/absenteismo/page.tsx`, `src/app/dashboards/turnover/page.tsx`, `src/app/dashboards/epi/page.tsx`, `src/app/dashboards/ocorrencias/page.tsx`, `src/app/formularios/layout.tsx`
- Create: `src/app/sem-acesso/page.tsx`

**Interfaces:** consome `podeVerTela`, `SemAcesso` (Task 1) e `getSessionReadOnly` (`@/lib/auth-session`).

- [ ] **Step 1: Padronizar as duas telas que já bloqueiam**

Em `epi/page.tsx` e `ocorrencias/page.tsx`: trocar o `podeVer` inline e o bloco de aviso pelo helper e pelo componente —

```tsx
const s = await getSessionReadOnly()
const auth = s.status === "ok" ? s.sessao.authorization : null
if (!podeVerTela(auth, "epi")) return <SemAcesso tela="EPI" />
```

(idem para `"ocorrencias"` / `tela="Controle de Ocorrências"`). Comportamento idêntico ao de hoje; só sai a duplicação.

- [ ] **Step 2: Aplicar o mesmo gate nas três que não bloqueiam**

- `absenteismo/page.tsx` → `if (!podeVerTela(auth, "absenteismo")) return <SemAcesso tela="Absenteísmo" />`
- `turnover/page.tsx` → `if (!podeVerTela(auth, "turnover")) return <SemAcesso tela="Turnover" />`
- `dashboards/page.tsx` (visão geral) → `if (!podeVerTela(auth, "visao-geral")) return <SemAcesso tela="Visão geral" />`

Nas três, buscar a sessão com `getSessionReadOnly()` **antes** de qualquer consulta pesada, para quem não tem acesso não disparar consulta ao banco.

- [ ] **Step 3: A visão geral só mostra os cards que a pessoa pode abrir**

Ainda em `dashboards/page.tsx`: cada card de indicador (Absenteísmo, Turnover, EPI, Ocorrências) só é renderizado se `podeVerTela(auth, "<key>")`. Se a pessoa vê a visão geral mas nenhum indicador, mostrar uma linha: "Nenhum indicador liberado para você ainda." As consultas de resumo de um indicador não permitido **não** devem ser executadas.

- [ ] **Step 4: Gate do formulário**

Em `src/app/formularios/layout.tsx`, depois da checagem de sessão que já existe:

```tsx
const { authorization } = resultado.sessao
if (!podeVerTela(authorization, "formularios")) {
  return (
    <MobileShell nome={authorization.nome ?? authorization.email}>
      <SemAcesso tela="Formulários" />
    </MobileShell>
  )
}
```

(assim a pessoa ainda vê a casca com o botão "Sair", em vez de uma tela morta.)

- [ ] **Step 5: Página de aviso para quem não tem nenhuma tela**

Create `src/app/sem-acesso/page.tsx` — Server Component simples, sem sidebar: logo, "Seu acesso ainda não foi liberado", "Peça a um administrador para liberar as telas que você precisa." e um botão "Sair" (POST `/api/auth/logout` via um pequeno client component ou um link para `/login`). Não exigir nenhuma tela para abrir, só sessão válida.

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit && npm test && npx next build`
Expected: limpo. Conferir lendo o código: nenhuma página de tela roda consulta antes do gate.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboards src/app/formularios/layout.tsx src/app/sem-acesso
git commit -m "feat: bloqueio real por tela no servidor em todos os paineis e no formulario"
```

---

### Task 3: Destino ao entrar e "Início" do celular

**Files:**
- Modify: `src/app/page.tsx`, `src/components/formularios/BottomNav.tsx`
- Verify (sem alterar, se já estiver correto): `src/components/dashboard/DashboardSidebar.tsx`, `src/components/admin/UsuariosAdmin.tsx`

**Interfaces:** consome `primeiraTelaPermitida` (Task 1).

- [ ] **Step 1: A raiz manda para a primeira tela permitida**

`src/app/page.tsx` hoje redireciona para `/dashboards`. Passar a:

```tsx
const s = await getSessionReadOnly()
if (s.status !== "ok") redirect("/login")
redirect(primeiraTelaPermitida(s.sessao.authorization))
```

(manter `export const dynamic = "force-dynamic"` se já houver; o redirect depende da sessão.)

- [ ] **Step 2: "Início" do app mobile**

Em `BottomNav.tsx`, o botão "Início" passa de `router.push("/dashboards")` para `router.push("/")` — a raiz resolve o destino conforme o acesso, então quem só tem formulário não cai numa tela bloqueada.

- [ ] **Step 3: Conferir a sidebar e a administração (sem mudar, se já estiverem certas)**

- `DashboardSidebar`: `HREF_TO_KEY` vem de `HUB_SCREENS`, então o item "Formulários" passa a ser filtrado automaticamente. Confirmar que ele some para quem não tem a tela e continua aparecendo para admin.
- `UsuariosAdmin`: a lista de telas do modal vem de `HUB_SCREENS`, então "Formulários" deve aparecer sozinho como opção concedível, e o contador "X de N" deve virar "X de 6". Confirmar; não reescrever.

Relatar o que encontrou em cada um.

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npm test && npx next build`
Expected: limpo.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/formularios/BottomNav.tsx
git commit -m "feat: entrada do hub leva para a primeira tela permitida"
```

---

### Task 4: Verificação com o usuário e publicação

- [ ] **Step 1:** `npm test && npx tsc --noEmit && npm run build` (parar o servidor antes).
- [ ] **Step 2:** subir o servidor e pedir ao usuário, como admin: criar/ajustar um usuário de teste com **somente** "Formulários", entrar com ele e confirmar que (a) cai em `/formularios`, (b) a sidebar do hub não mostra os painéis, (c) digitar `/dashboards/turnover` mostra o aviso de sem acesso, (d) o admin continua vendo tudo.
- [ ] **Step 3:** só após o aviso do usuário de que `FORMULARIOS_ID_SECRET` existe na Vercel (produção e preview): `git checkout main && git merge --no-ff feat/checklist-carregamento && git push origin main`, e acompanhar o deploy.
- [ ] **Step 4:** depois do deploy, conferência em produção: `/login` abre, um admin entra, `/formularios` funciona e um envio real grava (o usuário decide se faz).
