# Checklist de Carregamento — Minuto livre e CPF fora do aparelho (increment 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar as duas decisões do usuário em 2026-09-14: (A) o horário do carregamento volta a aceitar **qualquer minuto**, sem voltar ao seletor nativo; (B) o **CPF deixa de ser enviado ao navegador** e de ficar no rascunho do aparelho.

**Architecture:** (A) o `DataHoraSheet` ganha um campo de hora livre (`HH:MM`, validado por função pura) ao lado das sugestões rápidas; o valor gravado continua `"YYYY-MM-DDTHH:mm"`. (B) a página do wizard passa a mandar um **id opaco** por pessoa (HMAC do CPF com segredo do servidor, estável entre requisições); o POST recalcula os ids a partir da SRA que já lê e resolve o CPF no servidor; a saída do app limpa o rascunho.

**Tech Stack:** Next.js 14 (App Router) + TypeScript strict + Tailwind + Prisma 5 + vitest + `node:crypto`.

**Spec:** `docs/superpowers/specs/2026-09-10-checklist-carregamento-design.md` (seção "Ajustes pedidos em 2026-09-14" + estas duas decisões)

## Global Constraints

- **NUNCA** `prisma db push` / `migrate` — `DATABASE_URL` é o db_inhaus **compartilhado**. Nenhuma mudança de banco neste increment (as tabelas e os dois índices já existem).
- O valor de data/hora gravado continua **`"YYYY-MM-DDTHH:mm"`** (hora de Brasília, UTC−03:00 fixo). `paraDataBrasilia` não muda.
- **Nada de seletor nativo** (`datetime-local`, `<select>`): o painel continua sendo a única interface de escolha.
- Overlays só via o `Sheet` existente (`createPortal` + `fixed`) — regra do CLAUDE.md.
- **CPF não vai para o cliente**: nem em props de Server → Client Component, nem no `localStorage`, nem no corpo do POST, nem em log.
- Supervisor = `SUPERVISOR DE LOGISTICA`; Líder = `OPERADOR LOGISTICO LIDER`; validação continua **no servidor** contra a SRA do momento.
- Textos em português, sem termos técnicos.
- Verificação: `npm test` + `npx tsc --noEmit` + `npx next build` (o `npm run build` composto pode bater EPERM no engine do Prisma se houver servidor rodando — pare o servidor ou use `npx next build`).
- Commits em português, terminando com as duas linhas de atribuição do dispatch.

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/formularios/calendario.ts` (+ `.test.ts`) | `horaValida`, `normalizarHora`; `HORAS` vira lista de sugestões |
| `src/components/formularios/DataHoraSheet.tsx` | campo de hora livre + sugestões rápidas |
| `src/lib/formularios/identificadores.ts` (+ `.test.ts`) | id opaco por pessoa (HMAC), resolução id → pessoa |
| `src/lib/formularios/sra.ts` | `getPessoasSra` passa a devolver `id` junto |
| `src/lib/formularios/regras.ts` (+ `.test.ts`) | `PessoaSra.id`; payload passa a usar ids |
| `src/lib/formularios/checklist.ts` (+ `.test.ts`) | `montarRegistro` resolve CPF pelo id |
| `src/app/formularios/carregamento/page.tsx` | envia lista SEM cpf ao cliente |
| `src/app/api/formularios/checklist-carregamento/route.ts` | valida e grava a partir dos ids |
| `src/components/formularios/*` (wizard, listas, etapas) | passam a usar `id` no lugar de `cpf` |
| `src/components/formularios/BottomNav.tsx` | "Sair" limpa o rascunho do aparelho |

---

### Task 1: Horário com qualquer minuto

**Files:**
- Modify: `src/lib/formularios/calendario.ts`, `src/lib/formularios/calendario.test.ts`, `src/components/formularios/DataHoraSheet.tsx`

**Interfaces:**
- Produces, de `@/lib/formularios/calendario`:
  - `horaValida(hora: string): boolean` — `"07:45"` → true; `"7:45"`, `"24:00"`, `"07:60"`, `""` → false
  - `normalizarHora(bruto: string): string` — aceita o que a pessoa digita e devolve `"HH:MM"` ou `""`: `"745"` → `"07:45"`, `"7:5"` → `"07:05"`, `"1945"` → `"19:45"`, `"abc"` → `""`
  - `HORAS` continua existindo, agora como **sugestões** (mesmos 48 valores)

- [ ] **Step 1: Testes (falhando)**

Append em `src/lib/formularios/calendario.test.ts`:

```ts
import { horaValida, normalizarHora } from "./calendario"

describe("horaValida", () => {
  it("aceita HH:MM de 00:00 a 23:59", () => {
    expect(horaValida("00:00")).toBe(true)
    expect(horaValida("07:45")).toBe(true)
    expect(horaValida("23:59")).toBe(true)
  })
  it("recusa formato ou faixa inválidos", () => {
    for (const h of ["", "7:45", "24:00", "07:60", "0745", "ab:cd"]) expect(horaValida(h)).toBe(false)
  })
})

describe("normalizarHora", () => {
  it("completa o que a pessoa digitou", () => {
    expect(normalizarHora("745")).toBe("07:45")
    expect(normalizarHora("1945")).toBe("19:45")
    expect(normalizarHora("7:5")).toBe("07:05")
    expect(normalizarHora(" 07:45 ")).toBe("07:45")
  })
  it("devolve vazio para o que não dá para interpretar", () => {
    for (const h of ["", "abc", "99:99", "2560"]) expect(normalizarHora(h)).toBe("")
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- calendario`
Expected: FAIL — `horaValida is not a function`.

- [ ] **Step 3: Implementar as funções puras**

Em `src/lib/formularios/calendario.ts`, acrescentar (e trocar o comentário de `HORAS` para "sugestões rápidas"):

```ts
const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/

export function horaValida(hora: string): boolean {
  return HORA.test(hora ?? "")
}

/** Aceita "745", "7:5", "19:45" e devolve "HH:MM"; "" quando não dá para interpretar. */
export function normalizarHora(bruto: string): string {
  const limpo = (bruto ?? "").trim()
  if (!limpo) return ""
  const m = /^(\d{1,2})\D?(\d{1,2})$/.exec(limpo)
  if (!m) return ""
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return ""
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Campo de hora livre no painel**

Em `src/components/formularios/DataHoraSheet.tsx`: acima da grade de sugestões, um campo de texto para a hora; as sugestões continuam e passam a preencher o campo.

- estado novo: `const [horaTexto, setHoraTexto] = useState(inicial.hora)`, sincronizado no mesmo `useEffect` de reabertura;
- `const horaFinal = normalizarHora(horaTexto)`; `const pronto = !!data && horaValida(horaFinal)`;
- ao confirmar: `onConfirmar(juntar(data, horaFinal))`;
- campo:

```tsx
<p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A79BB0]">Horário</p>
<input
  value={horaTexto}
  onChange={(e) => setHoraTexto(e.target.value)}
  onBlur={() => { const n = normalizarHora(horaTexto); if (n) setHoraTexto(n) }}
  inputMode="numeric"
  placeholder="Ex. 07:45"
  aria-label="Horário (hora e minuto)"
  aria-invalid={!!horaTexto && !horaValida(normalizarHora(horaTexto))}
  className="h-[46px] w-full rounded-[14px] border border-[#E7DEED] bg-white px-3 text-[15px] font-semibold text-[#201429] outline-none focus:border-[rgba(75,0,133,.5)] focus:shadow-[0_0_0_3px_rgba(75,0,133,.16)]"
/>
{!!horaTexto && !horaValida(normalizarHora(horaTexto)) && (
  <p className="mt-1.5 text-xs font-medium text-[#C42B2B]">Use um horário entre 00:00 e 23:59.</p>
)}
<p className="mb-2 mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A79BB0]">Sugestões</p>
```

…e os botões de `HORAS` passam a fazer `onClick={() => setHoraTexto(h)}`, com o realce comparando `h === normalizarHora(horaTexto)`.

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit && npm test && npx next build`
Expected: limpo. Conferir no código que o valor entregue ao wizard continua `"YYYY-MM-DDTHH:mm"` (agora com qualquer minuto).

- [ ] **Step 7: Commit**

```bash
git add src/lib/formularios/calendario.ts src/lib/formularios/calendario.test.ts src/components/formularios/DataHoraSheet.tsx
git commit -m "feat: horario do checklist aceita qualquer minuto"
```

---

### Task 2: CPF fora do navegador (id opaco) e rascunho limpo na saída

**Files:**
- Create: `src/lib/formularios/identificadores.ts`, `src/lib/formularios/identificadores.test.ts`
- Modify: `src/lib/formularios/sra.ts`, `regras.ts` (+ `.test.ts`), `checklist.ts` (+ `.test.ts`), `src/app/formularios/carregamento/page.tsx`, `src/app/api/formularios/checklist-carregamento/route.ts`, `src/components/formularios/{ChecklistWizard,EtapaEquipe,EtapaResponsaveis,ListaPessoas,OperadoresSheet,PessoaSheet,BottomNav}.tsx`

**Interfaces:**
- `idDaPessoa(cpf: string): string` — HMAC-SHA256 do CPF com o segredo do servidor, `base64url`, 16 caracteres. Estável entre requisições e entre instâncias (o rascunho sobrevive a recarregar a página e a um redeploy).
- `type PessoaSra = { id: string; nome: string; funcao: string | null }` — **sem `cpf`**; o CPF passa a viver só em `PessoaSraServidor = PessoaSra & { cpf: string }`, que nunca sai do servidor.
- `getPessoasSra(): Promise<PessoaSraServidor[]>` e `paraCliente(pessoas: PessoaSraServidor[]): PessoaSra[]`.
- `ChecklistPayload` passa a carregar `operadores: string[]` (ids), `supervisorId`, `liderId`.

- [ ] **Step 1: Segredo e testes do id (falhando)**

Create `src/lib/formularios/identificadores.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { idDaPessoa } from "./identificadores"

describe("idDaPessoa", () => {
  it("é estável para o mesmo CPF", () => {
    expect(idDaPessoa("12345678901")).toBe(idDaPessoa("12345678901"))
  })
  it("é diferente para CPFs diferentes", () => {
    expect(idDaPessoa("12345678901")).not.toBe(idDaPessoa("10987654321"))
  })
  it("não contém o CPF", () => {
    expect(idDaPessoa("12345678901")).not.toContain("12345678901")
  })
  it("é curto e seguro para URL/JSON", () => {
    expect(idDaPessoa("12345678901")).toMatch(/^[A-Za-z0-9_-]{16}$/)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- identificadores`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

Create `src/lib/formularios/identificadores.ts`:

```ts
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
```

Documentar `FORMULARIOS_ID_SECRET` (opcional) no `.env.example` se houver, e mencioná-lo no relatório.

- [ ] **Step 4: SRA devolve id e esconde o CPF**

Em `src/lib/formularios/sra.ts`: `mapearPessoas` passa a devolver `PessoaSraServidor` com `id: idDaPessoa(cpf)`; acrescentar `export function paraCliente(pessoas: PessoaSraServidor[]): PessoaSra { ... }` (mapeia `{ id, nome, funcao }`). Atualizar `sra.test.ts` para o novo formato (o teste existente compara objetos — acrescentar `id` esperado usando `idDaPessoa`).

- [ ] **Step 5: Regras passam a falar em id**

Em `src/lib/formularios/regras.ts`:
- `PessoaSra` perde `cpf` e ganha `id: string`; criar `export type PessoaSraServidor = PessoaSra & { cpf: string }`;
- `ChecklistPayload.operadores` continua `string[]` (agora ids), `supervisorCpf` → `supervisorId`, `liderCpf` → `liderId`;
- `validarChecklist` casa por `id`; mensagens ao usuário **não mudam**;
- `etapaDoCampo` passa a mapear `supervisorId`/`liderId`.
Atualizar `regras.test.ts` trocando os cpfs dos fixtures por ids fictícios (`"id-ana"`, …) e os nomes de campo.

- [ ] **Step 6: Gravação resolve o CPF no servidor**

Em `src/lib/formularios/checklist.ts`: `montarRegistro(p, pessoas: PessoaSraServidor[], autor)` resolve cada id para a pessoa e grava `cpf`, `nome`, `funcao` como hoje (as colunas do banco **não mudam**). Atualizar `checklist.test.ts` conforme.

- [ ] **Step 7: Página e rota**

- `src/app/formularios/carregamento/page.tsx`: `const pessoas = paraCliente(await getPessoasSra())` — o Client Component recebe a lista **sem CPF**.
- `src/app/api/formularios/checklist-carregamento/route.ts`: continua lendo a SRA (`getPessoasSra()`, com CPF) e validando; só muda o tipo. Nada de CPF em log.

- [ ] **Step 8: Componentes usam id**

Trocar `cpf` por `id` como chave/parâmetro em `ChecklistWizard.tsx` (inclusive a chave do rascunho e o filtro de operadores que saíram da escala), `EtapaEquipe.tsx`, `EtapaResponsaveis.tsx`, `ListaPessoas.tsx`, `OperadoresSheet.tsx`, `PessoaSheet.tsx`. Comportamento e textos inalterados.

- [ ] **Step 9: "Sair" limpa o rascunho**

Em `src/components/formularios/BottomNav.tsx`, antes do `router.replace("/login")`, remover as chaves de rascunho do aparelho:

```ts
try {
  for (const chave of Object.keys(window.localStorage)) {
    if (chave.startsWith("amyris:rascunho:")) window.localStorage.removeItem(chave)
  }
} catch {}
```

- [ ] **Step 10: Verificar**

Run: `npx tsc --noEmit && npm test && npx next build`
Expected: limpo. Depois, conferir por busca que **nenhum** componente cliente recebe ou grava CPF:
`grep -rn "cpf" src/components src/app/formularios` — só devem sobrar ocorrências no servidor (páginas Server Component que chamam `paraCliente`, se houver) e nenhuma em props/estado de cliente.

- [ ] **Step 11: Commit**

```bash
git add src/lib/formularios src/app/formularios src/app/api/formularios src/components/formularios
git commit -m "feat: identificador opaco de pessoa (CPF nao sai do servidor) e rascunho limpo ao sair"
```

---

### Task 3: Verificação final do increment 3 (com o usuário)

**Files:** nenhum novo.

- [ ] **Step 1: Suíte completa**

Pare o servidor (para liberar o engine do Prisma) e rode: `npm test && npx tsc --noEmit && npm run build`.

- [ ] **Step 2: Servidor e roteiro**

`npm run start -- -p 3000` em segundo plano; confirmar `/login` 200 e `/formularios` 307. Roteiro para o usuário:
1. Período: digitar `11:45` no campo de horário e confirmar; a sugestão rápida continua funcionando.
2. Preencher meio checklist, recarregar: o rascunho volta. Sair pelo "Sair": ao entrar de novo, o rascunho **não** é oferecido.
3. Enviar o checklist de teste autorizado (ocorrência `TESTE — pode desconsiderar`).

- [ ] **Step 3: Conferência no banco (somente leitura)**

Com o nº do registro: 1 linha no cabeçalho, N operadores com nome e função, 7 EPIs, e o horário gravado com o minuto exato informado.
