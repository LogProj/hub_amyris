# Checklist de Carregamento (mobile) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Formulário mobile `/formularios` no hub_amyris com o Checklist de Carregamento (wizard de 4 etapas), gravação no db_inhaus e histórico de envios.

**Architecture:** Shell mobile próprio em `src/app/formularios` (sem sidebar), mesma sessão global_auth dos dashboards. Toda regra de negócio fica em funções puras (`src/lib/formularios/regras.ts`) usadas no cliente e no servidor e cobertas por vitest. Pessoas vêm da view SRA do db_inhaus (`inhausPool`); checklists vão para 4 tabelas dm_/ft_ via Prisma.

**Tech Stack:** Next.js 14 (App Router) + TypeScript strict + Tailwind 3.4 + lucide-react + Prisma 5 (Postgres) + pg + vitest (novo).

**Spec:** `docs/superpowers/specs/2026-09-10-checklist-carregamento-design.md`
**Design de referência (fonte da verdade visual):** `docs/design/checklist-carregamento-mobile.dc.html` — artboard `id="1a"` (lista) e `id="1b"` (wizard). Cores/raios/sombras/gradientes devem ser copiados dos `style="..."` desse arquivo.

## Global Constraints

- **NUNCA** rodar `prisma db push`, `prisma migrate dev/deploy/reset` nem qualquer DDL fora do arquivo SQL da Task 2: o `DATABASE_URL` é o **db_inhaus compartilhado** (28 tabelas + 6 views de outros sistemas).
- Nomes de tabela exatos: `dm_amyris_epi`, `ft_amyris_checklist_carregamento`, `ft_amyris_checklist_carregamento_operador`, `ft_amyris_checklist_carregamento_epi` (schema `public`).
- Fonte de pessoas: `public.vw_sra_amyris_diario`, snapshot mais recente, `dt_demissao is null`, **sem filtro de situação**.
- Supervisor = função `SUPERVISOR DE LOGISTICA`; Líder = `OPERADOR LOGISTICO LIDER` (comparação sem acento/caixa). Validado **no servidor**.
- Sob o nome da pessoa: **só a função**. CPF nunca aparece na tela.
- EPIs (ordem fixa): Luva, Bota, Capacete, Óculos, Protetor auricular, Cinto, Talabarte — status `sim` | `na` | `nao`.
- Obrigatórios: ≥1 operador, início e fim (fim ≥ início), nº do veículo, capacidade, supervisor, líder, 7 EPIs. Lacres 0–4. **EPI "Não" ⇒ ocorrência obrigatória.**
- Horários do formulário são hora de Brasília (UTC−03:00, sem horário de verão).
- Acesso: qualquer usuário logado no hub; `/formularios` NÃO entra em `HUB_SCREENS`.
- Overlay (bottom-sheet) em `createPortal(document.body)` + `position: fixed` (regra do CLAUDE.md).
- Textos de tela em português, sem termos técnicos (tabela, CPF, SRA-view etc. não aparecem para o usuário; "SRA" pode aparecer como nome da escala).
- Lint: o projeto não tem config ESLint (`next lint` abre prompt interativo) — verificar com `npx tsc --noEmit` + `npm run build`. Não criar config ESLint.
- Commits pequenos por task, mensagem em português no padrão `feat:`/`chore:` do repositório.

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `vitest.config.ts` | config do vitest com alias `@` |
| `src/lib/formularios/regras.ts` | tipos, EPIs, cargos, normalização e validação do payload, formatações (puro, sem I/O) |
| `src/lib/formularios/regras.test.ts` | testes das regras |
| `prisma/sql/2026-09-11-checklist-carregamento.sql` | DDL só-criação das 4 tabelas + carga do `dm_amyris_epi` |
| `scripts/aplicar-sql.mjs` | aplica um .sql no `DATABASE_URL`, recusando DROP/TRUNCATE/ALTER/DELETE FROM |
| `scripts/db-push-bloqueado.mjs` | substitui `npm run db:push` com erro explicativo |
| `prisma/schema.prisma` | + 4 models mapeados |
| `src/lib/formularios/sra.ts` (+ `.test.ts`) | leitura das pessoas ativas da SRA |
| `src/lib/formularios/checklist.ts` (+ `.test.ts`) | montar registro, salvar, listar histórico |
| `src/app/api/formularios/checklist-carregamento/route.ts` | POST de envio |
| `src/middleware.ts` | protege `/formularios` |
| `src/components/dashboard/DashboardSidebar.tsx` | link "Formulários" |
| `src/app/formularios/layout.tsx`, `page.tsx` | shell + tela 1A |
| `src/components/formularios/MobileShell.tsx`, `BottomNav.tsx`, `ui.tsx` | shell e peças visuais comuns |
| `src/app/formularios/carregamento/page.tsx` | carrega pessoas e monta o wizard |
| `src/components/formularios/ChecklistWizard.tsx`, `EtapaEquipe.tsx`, `EtapaEpis.tsx`, `EtapaVeiculo.tsx`, `EtapaResponsaveis.tsx`, `OperadoresSheet.tsx`, `ConfirmacaoEnvio.tsx`, `useRascunho.ts` | tela 1B |
| `src/app/formularios/historico/page.tsx` | histórico |
| `CLAUDE.md` | regra "nunca db push" |

---

### Task 1: vitest + regras de negócio puras

**Files:**
- Create: `vitest.config.ts`, `src/lib/formularios/regras.ts`, `src/lib/formularios/regras.test.ts`
- Modify: `package.json` (devDependency `vitest`, script `test`)

**Interfaces:**
- Produces (usado por todas as tasks seguintes), de `@/lib/formularios/regras`:
  - `EPIS: readonly { codigo: EpiCodigo; nome: string }[]`, `type EpiCodigo`, `type EpiStatus = "sim" | "na" | "nao"`, `MAX_LACRES = 4`
  - `type PessoaSra = { cpf: string; nome: string; funcao: string | null }`
  - `type ChecklistPayload`, `type ErroValidacao = { campo: CampoChecklist; mensagem: string }`, `type CampoChecklist`
  - `normalizarPayload(bruto: unknown): ChecklistPayload`
  - `validarChecklist(p: ChecklistPayload, pessoas: PessoaSra[]): ErroValidacao[]`
  - `podeSerSupervisor(p: PessoaSra): boolean`, `podeSerLider(p: PessoaSra): boolean`
  - `iniciais(nome: string): string`, `nomeCurto(nome: string): string`, `formatarFuncao(f: string | null): string`
  - `paraDataBrasilia(s: string): Date`, `resumoEpis(epis: ChecklistPayload["epis"]): string`, `etapaDoCampo(campo: CampoChecklist): 1 | 2 | 3 | 4`

- [ ] **Step 1: Instalar vitest e configurar**

Run: `npm install -D vitest@^2.1.0`

Em `package.json`, dentro de `"scripts"`, adicionar: `"test": "vitest run"`.

Create `vitest.config.ts`:

```ts
import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
})
```

- [ ] **Step 2: Escrever os testes (falhando)**

Create `src/lib/formularios/regras.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import {
  EPIS,
  etapaDoCampo,
  formatarFuncao,
  iniciais,
  nomeCurto,
  normalizarPayload,
  paraDataBrasilia,
  podeSerSupervisor,
  resumoEpis,
  validarChecklist,
  type ChecklistPayload,
  type PessoaSra,
} from "./regras"

const PESSOAS: PessoaSra[] = [
  { cpf: "111", nome: "Ana Souza", funcao: "OPERADOR LOGISTICO II" },
  { cpf: "222", nome: "Bruno Lima", funcao: "SUPERVISOR DE LOGISTICA" },
  { cpf: "333", nome: "Carla Dias", funcao: "OPERADOR LOGISTICO LIDER" },
]

const todosSim = Object.fromEntries(EPIS.map((e) => [e.codigo, "sim"])) as ChecklistPayload["epis"]

function valido(parcial: Partial<ChecklistPayload> = {}): ChecklistPayload {
  return {
    operadores: ["111"],
    inicioEm: "2026-09-11T07:30",
    fimEm: "2026-09-11T11:45",
    veiculoNumero: "1042",
    veiculoCapacidade: "28 t",
    lacres: ["A1"],
    epis: todosSim,
    supervisorCpf: "222",
    liderCpf: "333",
    ocorrencia: "",
    ...parcial,
  }
}

const campos = (p: ChecklistPayload) => validarChecklist(p, PESSOAS).map((e) => e.campo)

describe("validarChecklist", () => {
  it("aceita um checklist completo", () => {
    expect(campos(valido())).toEqual([])
  })
  it("exige pelo menos um operador", () => {
    expect(campos(valido({ operadores: [] }))).toEqual(["operadores"])
  })
  it("recusa operador que não está ativo na SRA", () => {
    expect(campos(valido({ operadores: ["999"] }))).toEqual(["operadores"])
  })
  it("exige início e fim", () => {
    expect(campos(valido({ inicioEm: "", fimEm: "" }))).toEqual(["inicioEm", "fimEm"])
  })
  it("recusa fim antes do início", () => {
    expect(campos(valido({ fimEm: "2026-09-11T06:00" }))).toEqual(["fimEm"])
  })
  it("exige número e capacidade do veículo", () => {
    expect(campos(valido({ veiculoNumero: "", veiculoCapacidade: "" }))).toEqual([
      "veiculoNumero",
      "veiculoCapacidade",
    ])
  })
  it("aceita no máximo 4 lacres", () => {
    expect(campos(valido({ lacres: ["1", "2", "3", "4", "5"] }))).toEqual(["lacres"])
  })
  it("exige os 7 EPIs respondidos", () => {
    expect(campos(valido({ epis: { ...todosSim, cinto: null } }))).toEqual(["epis"])
  })
  it("recusa supervisor sem o cargo de Supervisor de Logística", () => {
    expect(campos(valido({ supervisorCpf: "111" }))).toEqual(["supervisorCpf"])
  })
  it("recusa líder sem o cargo de Operador Logístico Líder", () => {
    expect(campos(valido({ liderCpf: "222" }))).toEqual(["liderCpf"])
  })
  it("exige ocorrência quando algum EPI é Não", () => {
    expect(campos(valido({ epis: { ...todosSim, luva: "nao" } }))).toEqual(["ocorrencia"])
    expect(campos(valido({ epis: { ...todosSim, luva: "nao" }, ocorrencia: "Luva rasgada" }))).toEqual([])
  })
})

describe("normalizarPayload", () => {
  it("apara textos, remove lacres vazios, deduplica operadores e anula status inválido", () => {
    const p = normalizarPayload({
      operadores: ["111", " 111 ", "", 7],
      inicioEm: " 2026-09-11T07:30 ",
      veiculoNumero: " 1042 ",
      lacres: ["A1", "  ", "B2"],
      epis: { luva: "sim", bota: "talvez" },
      ocorrencia: "  ",
    })
    expect(p.operadores).toEqual(["111"])
    expect(p.inicioEm).toBe("2026-09-11T07:30")
    expect(p.veiculoNumero).toBe("1042")
    expect(p.lacres).toEqual(["A1", "B2"])
    expect(p.epis.luva).toBe("sim")
    expect(p.epis.bota).toBeNull()
    expect(p.ocorrencia).toBe("")
    expect(p.fimEm).toBe("")
  })
  it("tolera corpo que não é objeto", () => {
    expect(normalizarPayload(null).operadores).toEqual([])
  })
})

describe("formatações e utilitários", () => {
  it("compara cargo sem acento e sem caixa", () => {
    expect(podeSerSupervisor({ cpf: "1", nome: "X", funcao: "Supervisor de Logística" })).toBe(true)
  })
  it("gera iniciais", () => {
    expect(iniciais("Rafael Alves Souza")).toBe("RS")
    expect(iniciais("Ana")).toBe("A")
  })
  it("gera nome curto", () => {
    expect(nomeCurto("Rafael Alves Souza")).toBe("R. Souza")
    expect(nomeCurto("Ana")).toBe("Ana")
  })
  it("formata a função para leitura", () => {
    expect(formatarFuncao("OPERADOR LOGISTICO II")).toBe("Operador Logistico II")
    expect(formatarFuncao("SUPERVISOR DE LOGISTICA")).toBe("Supervisor de Logistica")
    expect(formatarFuncao(null)).toBe("")
  })
  it("interpreta data/hora do formulário como horário de Brasília", () => {
    expect(paraDataBrasilia("2026-09-11T07:30").toISOString()).toBe("2026-09-11T10:30:00.000Z")
  })
  it("resume EPIs respondidos", () => {
    expect(resumoEpis(todosSim)).toBe("7 de 7 EPIs verificados")
    expect(resumoEpis({})).toBe("0 de 7 EPIs verificados")
  })
  it("mapeia campo para etapa do wizard", () => {
    expect(etapaDoCampo("fimEm")).toBe(1)
    expect(etapaDoCampo("epis")).toBe(2)
    expect(etapaDoCampo("lacres")).toBe(3)
    expect(etapaDoCampo("ocorrencia")).toBe(4)
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./regras"`.

- [ ] **Step 4: Implementar**

Create `src/lib/formularios/regras.ts`:

```ts
// Regras de negócio do Checklist de Carregamento. Funções PURAS (sem I/O), usadas
// no cliente (feedback imediato) e no servidor (fonte da verdade no POST).

export const EPIS = [
  { codigo: "luva", nome: "Luva" },
  { codigo: "bota", nome: "Bota" },
  { codigo: "capacete", nome: "Capacete" },
  { codigo: "oculos", nome: "Óculos" },
  { codigo: "auricular", nome: "Protetor auricular" },
  { codigo: "cinto", nome: "Cinto" },
  { codigo: "talabarte", nome: "Talabarte" },
] as const

export type EpiCodigo = (typeof EPIS)[number]["codigo"]
export type EpiStatus = "sim" | "na" | "nao"
const EPI_STATUS: readonly EpiStatus[] = ["sim", "na", "nao"]

export const MAX_LACRES = 4
export const FUNCAO_SUPERVISOR = "SUPERVISOR DE LOGISTICA"
export const FUNCAO_LIDER = "OPERADOR LOGISTICO LIDER"

export type PessoaSra = { cpf: string; nome: string; funcao: string | null }

export type ChecklistPayload = {
  operadores: string[] // cpfs
  inicioEm: string // "YYYY-MM-DDTHH:mm" (input datetime-local, hora de Brasília)
  fimEm: string
  veiculoNumero: string
  veiculoCapacidade: string
  lacres: string[]
  epis: Partial<Record<EpiCodigo, EpiStatus | null>>
  supervisorCpf: string
  liderCpf: string
  ocorrencia: string
}

export type CampoChecklist = Exclude<keyof ChecklistPayload, never>
export type ErroValidacao = { campo: CampoChecklist; mensagem: string }

export function normalizarFuncao(f: string | null | undefined): string {
  return (f ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
}

export const podeSerSupervisor = (p: PessoaSra) => normalizarFuncao(p.funcao) === FUNCAO_SUPERVISOR
export const podeSerLider = (p: PessoaSra) => normalizarFuncao(p.funcao) === FUNCAO_LIDER

export function normalizarPayload(bruto: unknown): ChecklistPayload {
  const o = (bruto && typeof bruto === "object" ? bruto : {}) as Record<string, unknown>
  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "")
  const lista = (v: unknown) =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
      : []
  const episBrutos = (o.epis && typeof o.epis === "object" ? o.epis : {}) as Record<string, unknown>
  const epis: ChecklistPayload["epis"] = {}
  for (const { codigo } of EPIS) {
    const v = episBrutos[codigo]
    epis[codigo] = EPI_STATUS.includes(v as EpiStatus) ? (v as EpiStatus) : null
  }
  return {
    operadores: Array.from(new Set(lista(o.operadores))),
    inicioEm: texto(o.inicioEm),
    fimEm: texto(o.fimEm),
    veiculoNumero: texto(o.veiculoNumero),
    veiculoCapacidade: texto(o.veiculoCapacidade),
    lacres: lista(o.lacres),
    epis,
    supervisorCpf: texto(o.supervisorCpf),
    liderCpf: texto(o.liderCpf),
    ocorrencia: texto(o.ocorrencia),
  }
}

const DATA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export function validarChecklist(p: ChecklistPayload, pessoas: PessoaSra[]): ErroValidacao[] {
  const erros: ErroValidacao[] = []
  const porCpf = new Map(pessoas.map((x) => [x.cpf, x]))

  if (p.operadores.length === 0) {
    erros.push({ campo: "operadores", mensagem: "Adicione pelo menos um operador." })
  } else if (p.operadores.some((c) => !porCpf.has(c))) {
    erros.push({
      campo: "operadores",
      mensagem: "Há operador que não está mais ativo na escala. Remova e adicione de novo.",
    })
  }

  const inicioOk = DATA_HORA.test(p.inicioEm)
  if (!inicioOk) erros.push({ campo: "inicioEm", mensagem: "Informe a data e hora de início." })
  if (!DATA_HORA.test(p.fimEm)) {
    erros.push({ campo: "fimEm", mensagem: "Informe a data e hora de fim." })
  } else if (inicioOk && p.fimEm < p.inicioEm) {
    erros.push({ campo: "fimEm", mensagem: "O fim não pode ser antes do início." })
  }

  if (!p.veiculoNumero) erros.push({ campo: "veiculoNumero", mensagem: "Informe o número do veículo." })
  if (!p.veiculoCapacidade) erros.push({ campo: "veiculoCapacidade", mensagem: "Informe a capacidade do veículo." })
  if (p.lacres.length > MAX_LACRES) erros.push({ campo: "lacres", mensagem: `Use no máximo ${MAX_LACRES} lacres.` })

  const semResposta = EPIS.filter((e) => !p.epis[e.codigo]).length
  if (semResposta > 0) erros.push({ campo: "epis", mensagem: `Responda todos os EPIs (faltam ${semResposta}).` })

  const sup = porCpf.get(p.supervisorCpf)
  if (!p.supervisorCpf) erros.push({ campo: "supervisorCpf", mensagem: "Escolha o supervisor responsável." })
  else if (!sup || !podeSerSupervisor(sup))
    erros.push({ campo: "supervisorCpf", mensagem: "A pessoa escolhida não é Supervisor de Logística na escala." })

  const lider = porCpf.get(p.liderCpf)
  if (!p.liderCpf) erros.push({ campo: "liderCpf", mensagem: "Escolha o líder responsável." })
  else if (!lider || !podeSerLider(lider))
    erros.push({ campo: "liderCpf", mensagem: "A pessoa escolhida não é Operador Logístico Líder na escala." })

  if (EPIS.some((e) => p.epis[e.codigo] === "nao") && !p.ocorrencia) {
    erros.push({
      campo: "ocorrencia",
      mensagem: "Algum EPI ficou como \"Não\": descreva o que aconteceu na ocorrência.",
    })
  }
  return erros
}

export function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean)
  if (p.length === 0) return "?"
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase()
}

export function nomeCurto(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean)
  if (p.length < 2) return p[0] ?? ""
  return `${p[0][0].toUpperCase()}. ${p[p.length - 1]}`
}

const MINUSCULAS = new Set(["DE", "DA", "DO", "DAS", "DOS", "E"])
const ROMANO = /^(I|II|III|IV|V)$/

export function formatarFuncao(f: string | null): string {
  if (!f) return ""
  return f
    .trim()
    .split(/\s+/)
    .map((w, i) => {
      const u = w.toUpperCase()
      if (ROMANO.test(u)) return u
      if (i > 0 && MINUSCULAS.has(u)) return u.toLowerCase()
      return u.charAt(0) + u.slice(1).toLowerCase()
    })
    .join(" ")
}

// Brasil não tem horário de verão desde 2019: Brasília = UTC−03:00 fixo.
export function paraDataBrasilia(s: string): Date {
  return new Date(`${s}:00-03:00`)
}

export function resumoEpis(epis: ChecklistPayload["epis"]): string {
  const n = EPIS.filter((e) => epis[e.codigo]).length
  return `${n} de ${EPIS.length} EPIs verificados`
}

const ETAPA: Record<CampoChecklist, 1 | 2 | 3 | 4> = {
  operadores: 1,
  inicioEm: 1,
  fimEm: 1,
  epis: 2,
  veiculoNumero: 3,
  veiculoCapacidade: 3,
  lacres: 3,
  supervisorCpf: 4,
  liderCpf: 4,
  ocorrencia: 4,
}
export const etapaDoCampo = (campo: CampoChecklist) => ETAPA[campo]
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test`
Expected: PASS — todos os testes de `regras.test.ts` verdes.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/formularios/regras.ts src/lib/formularios/regras.test.ts
git commit -m "feat: regras do checklist de carregamento (validacao, cargos, EPIs) com vitest"
```

---

### Task 2: Tabelas dm_/ft_ no db_inhaus (só criação) + Prisma + trava do db:push

**Files:**
- Create: `prisma/sql/2026-09-11-checklist-carregamento.sql`, `scripts/aplicar-sql.mjs`, `scripts/db-push-bloqueado.mjs`
- Modify: `prisma/schema.prisma` (append models), `package.json` (`db:push`), `CLAUDE.md` (append section)

**Interfaces:**
- Produces: Prisma client `prisma.ftAmyrisChecklistCarregamento` (campos camelCase abaixo), com relações `operadores` e `epis`.

- [ ] **Step 1: Escrever o SQL (só CREATE / INSERT idempotentes)**

Create `prisma/sql/2026-09-11-checklist-carregamento.sql`:

```sql
-- Checklist de Carregamento (hub_amyris) — db_inhaus, schema public.
-- SÓ CRIA: não modifica nem remove nada que já exista. Pode rodar mais de uma vez.
begin;

create table if not exists public.dm_amyris_epi (
  codigo text primary key,
  nome   text not null,
  ordem  integer not null,
  ativo  boolean not null default true
);

insert into public.dm_amyris_epi (codigo, nome, ordem) values
  ('luva', 'Luva', 1),
  ('bota', 'Bota', 2),
  ('capacete', 'Capacete', 3),
  ('oculos', 'Óculos', 4),
  ('auricular', 'Protetor auricular', 5),
  ('cinto', 'Cinto', 6),
  ('talabarte', 'Talabarte', 7)
on conflict (codigo) do nothing;

create table if not exists public.ft_amyris_checklist_carregamento (
  id                 serial primary key,
  criado_por_id      integer,
  criado_por_email   text not null,
  criado_por_nome    text,
  inicio_em          timestamptz not null,
  fim_em             timestamptz not null,
  veiculo_numero     text not null,
  veiculo_capacidade text not null,
  lacres             text[] not null default '{}',
  supervisor_cpf     text not null,
  supervisor_nome    text not null,
  supervisor_funcao  text not null,
  lider_cpf          text not null,
  lider_nome         text not null,
  lider_funcao       text not null,
  ocorrencia         text,
  enviado_em         timestamptz not null default now()
);

create index if not exists ft_amyris_checklist_carregamento_enviado_em_idx
  on public.ft_amyris_checklist_carregamento (enviado_em desc);

create table if not exists public.ft_amyris_checklist_carregamento_operador (
  id           serial primary key,
  checklist_id integer not null references public.ft_amyris_checklist_carregamento (id) on delete cascade,
  cpf          text not null,
  nome         text not null,
  funcao       text,
  unique (checklist_id, cpf)
);

create table if not exists public.ft_amyris_checklist_carregamento_epi (
  id           serial primary key,
  checklist_id integer not null references public.ft_amyris_checklist_carregamento (id) on delete cascade,
  epi_codigo   text not null references public.dm_amyris_epi (codigo),
  status       text not null check (status in ('sim', 'na', 'nao')),
  unique (checklist_id, epi_codigo)
);

commit;
```

- [ ] **Step 2: Script de aplicação com trava**

Create `scripts/aplicar-sql.mjs`:

```js
// Aplica um arquivo .sql no DATABASE_URL (db_inhaus COMPARTILHADO).
// Recusa qualquer arquivo com comandos destrutivos. Uso: node scripts/aplicar-sql.mjs <arquivo.sql>
import fs from "node:fs"
import pg from "pg"

const arquivo = process.argv[2]
if (!arquivo) {
  console.error("Uso: node scripts/aplicar-sql.mjs <arquivo.sql>")
  process.exit(1)
}

const sql = fs.readFileSync(arquivo, "utf8")
if (/\b(drop|truncate|alter)\b|\bdelete\s+from\b/i.test(sql)) {
  console.error("Recusado: o arquivo contém DROP/TRUNCATE/ALTER/DELETE FROM.")
  process.exit(1)
}

function lerEnvLocal() {
  if (!fs.existsSync(".env.local")) return {}
  return Object.fromEntries(
    fs
      .readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => {
        const i = l.indexOf("=")
        return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, "")]
      }),
  )
}

const url = process.env.DATABASE_URL || lerEnvLocal().DATABASE_URL
if (!url) {
  console.error("DATABASE_URL não definido (.env.local ou ambiente).")
  process.exit(1)
}

const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  await client.query(sql)
  console.log("OK:", arquivo)
} finally {
  await client.end()
}
```

Create `scripts/db-push-bloqueado.mjs`:

```js
console.error(
  "Bloqueado: o DATABASE_URL aponta para o db_inhaus COMPARTILHADO. `prisma db push` apagaria " +
    "tabelas de outros sistemas. Crie tabelas com um .sql só-criação e rode: node scripts/aplicar-sql.mjs <arquivo>",
)
process.exit(1)
```

Em `package.json`, trocar `"db:push": "prisma db push"` por `"db:push": "node scripts/db-push-bloqueado.mjs"`.

- [ ] **Step 3: Conferir que o script recusa SQL destrutivo**

Run: `echo "drop table x;" > "$TMPDIR/teste-drop.sql" ; node scripts/aplicar-sql.mjs "$TMPDIR/teste-drop.sql"`
(Git Bash no Windows: se `$TMPDIR` estiver vazio, use o diretório scratchpad da sessão.)
Expected: `Recusado: o arquivo contém DROP/TRUNCATE/ALTER/DELETE FROM.` e exit code 1. Nada é conectado.

- [ ] **Step 4: Aplicar o SQL (aprovado pelo usuário em 2026-09-11 — só estas 4 tabelas)**

Run: `node scripts/aplicar-sql.mjs prisma/sql/2026-09-11-checklist-carregamento.sql`
Expected: `OK: prisma/sql/2026-09-11-checklist-carregamento.sql`

Conferir (somente leitura):

```bash
node -e "
const {Pool}=require('pg');const fs=require('fs');
const l=fs.readFileSync('.env.local','utf8').split(/\r?\n/).find(x=>x.startsWith('DATABASE_URL='));
const p=new Pool({connectionString:l.slice(13).replace(/^\"|\"$/g,'')});
p.query(\"select table_name from information_schema.tables where table_schema='public' and table_name like any(array['dm_amyris_%','ft_amyris_%']) order by 1\")
 .then(r=>{console.log(r.rows.map(x=>x.table_name));return p.query('select count(*)::int n from public.dm_amyris_epi')})
 .then(r=>{console.log('epis:',r.rows[0].n);p.end()})"
```

Expected: as 4 tabelas listadas e `epis: 7`.

- [ ] **Step 5: Models no Prisma**

Append em `prisma/schema.prisma`:

```prisma
// ---------------------------------------------------------------------------
// Checklist de Carregamento (formulário mobile). Tabelas criadas por
// prisma/sql/2026-09-11-checklist-carregamento.sql — NUNCA via db push/migrate:
// o DATABASE_URL é o db_inhaus compartilhado.
// ---------------------------------------------------------------------------

model DmAmyrisEpi {
  codigo    String                             @id
  nome      String
  ordem     Int
  ativo     Boolean                            @default(true)
  respostas FtAmyrisChecklistCarregamentoEpi[]

  @@map("dm_amyris_epi")
}

model FtAmyrisChecklistCarregamento {
  id                Int                                     @id @default(autoincrement())
  criadoPorId       Int?                                    @map("criado_por_id")
  criadoPorEmail    String                                  @map("criado_por_email")
  criadoPorNome     String?                                 @map("criado_por_nome")
  inicioEm          DateTime                                @map("inicio_em") @db.Timestamptz(6)
  fimEm             DateTime                                @map("fim_em") @db.Timestamptz(6)
  veiculoNumero     String                                  @map("veiculo_numero")
  veiculoCapacidade String                                  @map("veiculo_capacidade")
  lacres            String[]                                @default([])
  supervisorCpf     String                                  @map("supervisor_cpf")
  supervisorNome    String                                  @map("supervisor_nome")
  supervisorFuncao  String                                  @map("supervisor_funcao")
  liderCpf          String                                  @map("lider_cpf")
  liderNome         String                                  @map("lider_nome")
  liderFuncao       String                                  @map("lider_funcao")
  ocorrencia        String?
  enviadoEm         DateTime                                @default(now()) @map("enviado_em") @db.Timestamptz(6)
  operadores        FtAmyrisChecklistCarregamentoOperador[]
  epis              FtAmyrisChecklistCarregamentoEpi[]

  @@map("ft_amyris_checklist_carregamento")
}

model FtAmyrisChecklistCarregamentoOperador {
  id          Int                           @id @default(autoincrement())
  checklistId Int                           @map("checklist_id")
  cpf         String
  nome        String
  funcao      String?
  checklist   FtAmyrisChecklistCarregamento @relation(fields: [checklistId], references: [id], onDelete: Cascade)

  @@unique([checklistId, cpf])
  @@map("ft_amyris_checklist_carregamento_operador")
}

model FtAmyrisChecklistCarregamentoEpi {
  id          Int                           @id @default(autoincrement())
  checklistId Int                           @map("checklist_id")
  epiCodigo   String                        @map("epi_codigo")
  status      String
  checklist   FtAmyrisChecklistCarregamento @relation(fields: [checklistId], references: [id], onDelete: Cascade)
  epi         DmAmyrisEpi                   @relation(fields: [epiCodigo], references: [codigo])

  @@unique([checklistId, epiCodigo])
  @@map("ft_amyris_checklist_carregamento_epi")
}
```

Run: `npx prisma validate && npx prisma generate`
Expected: `The schema at prisma/schema.prisma is valid` e `Generated Prisma Client`.

- [ ] **Step 6: Regra no CLAUDE.md**

Append em `CLAUDE.md`:

```markdown

## Banco de dados — NUNCA `prisma db push` / `migrate` (OBRIGATÓRIO)

O `DATABASE_URL` do Prisma aponta para o **db_inhaus**, banco COMPARTILHADO com outros
sistemas (dezenas de tabelas e views que o schema deste projeto não conhece).
`prisma db push`, `migrate dev/deploy/reset` tentariam deixar o banco igual ao schema e
**apagariam tabelas alheias**. Por isso `npm run db:push` está bloqueado.

Tabela nova = arquivo `.sql` só-criação em `prisma/sql/` (`create table if not exists`,
sem DROP/ALTER/TRUNCATE/DELETE) aplicado com `node scripts/aplicar-sql.mjs <arquivo>`,
e o model correspondente no `schema.prisma` com `@@map`. Tabelas do hub seguem o
padrão dimensional `dm_amyris_*` (cadastros) / `ft_amyris_*` (registros).
```

- [ ] **Step 7: Commit**

```bash
git add prisma/sql prisma/schema.prisma scripts package.json CLAUDE.md
git commit -m "feat: tabelas dm_/ft_ do checklist de carregamento (sql so-criacao) e trava do db:push"
```

---

### Task 3: Leitura das pessoas ativas da SRA

**Files:**
- Create: `src/lib/formularios/sra.ts`, `src/lib/formularios/sra.test.ts`

**Interfaces:**
- Consumes: `PessoaSra` (Task 1), `inhausPool` de `@/lib/db-inhaus`.
- Produces: `getPessoasSra(): Promise<PessoaSra[]>` (ordenado por nome), `mapearPessoas(rows: LinhaSra[]): PessoaSra[]`.

- [ ] **Step 1: Teste (falhando)**

Create `src/lib/formularios/sra.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mapearPessoas } from "./sra"

describe("mapearPessoas", () => {
  it("apara campos, descarta linha sem cpf e ordena por nome", () => {
    expect(
      mapearPessoas([
        { cpf: " 2 ", nome: " Bruno ", descricao_funcao: "SUPERVISOR DE LOGISTICA " },
        { cpf: "", nome: "Sem CPF", descricao_funcao: null },
        { cpf: "1", nome: "Ana", descricao_funcao: null },
        { cpf: "3", nome: null, descricao_funcao: "  " },
      ]),
    ).toEqual([
      { cpf: "1", nome: "Ana", funcao: null },
      { cpf: "2", nome: "Bruno", funcao: "SUPERVISOR DE LOGISTICA" },
      { cpf: "3", nome: "—", funcao: null },
    ])
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- sra`
Expected: FAIL — `Failed to resolve import "./sra"`.

- [ ] **Step 3: Implementar**

Create `src/lib/formularios/sra.ts`:

```ts
import { inhausPool } from "@/lib/db-inhaus"
import type { PessoaSra } from "./regras"

/**
 * Pessoas ATIVAS do CR Amyris (Barra Bonita) no snapshot mais recente da
 * public.vw_sra_amyris_diario — mesma fonte do Turnover/Absenteísmo. Sem filtro de
 * situação (NORMAL/FÉRIAS/AFASTADO entram todos), por decisão do negócio.
 */
export type LinhaSra = { cpf: string | null; nome: string | null; descricao_funcao: string | null }

export function mapearPessoas(rows: LinhaSra[]): PessoaSra[] {
  return rows
    .filter((r) => r.cpf && r.cpf.trim())
    .map((r) => ({
      cpf: (r.cpf as string).trim(),
      nome: (r.nome ?? "").trim() || "—",
      funcao: r.descricao_funcao?.trim() || null,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
}

export async function getPessoasSra(): Promise<PessoaSra[]> {
  const { rows } = await inhausPool.query<LinhaSra>(
    `select distinct on (cpf) cpf, nome, descricao_funcao
       from public.vw_sra_amyris_diario
      where dt_demissao is null
        and data_referencia = (select max(data_referencia) from public.vw_sra_amyris_diario)
      order by cpf, data_referencia desc`,
  )
  return mapearPessoas(rows)
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS (regras + sra).

- [ ] **Step 5: Conferir contra o banco (somente leitura)**

Run: `npx tsx -e "import('./src/lib/formularios/sra.ts').then(async m=>{const p=await m.getPessoasSra();console.log(p.length, p.filter(x=>x.funcao?.includes('SUPERVISOR')).length, 'supervisores');process.exit(0)})"`
Se `tsx` não resolver o alias `@/`, conferir com o SQL da função direto via `node -e` + `pg` (mesmo padrão da Task 2, Step 4).
Expected: dezenas de pessoas e ≥1 supervisor. **Não imprimir nomes/CPFs no log.**

- [ ] **Step 6: Commit**

```bash
git add src/lib/formularios/sra.ts src/lib/formularios/sra.test.ts
git commit -m "feat: leitura das pessoas ativas da SRA para o checklist"
```

---

### Task 4: Persistência + API de envio

**Files:**
- Create: `src/lib/formularios/checklist.ts`, `src/lib/formularios/checklist.test.ts`, `src/app/api/formularios/checklist-carregamento/route.ts`

**Interfaces:**
- Consumes: `ChecklistPayload`, `PessoaSra`, `EPIS`, `paraDataBrasilia`, `normalizarPayload`, `validarChecklist` (Task 1); `getPessoasSra` (Task 3); `prisma` (Task 2 models); `requireSession` de `@/lib/auth-session`.
- Produces:
  - `type Autor = { usuarioId: number; email: string; nome: string | null }`
  - `montarRegistro(p, pessoas, autor): RegistroChecklist`, `salvarChecklist(p, pessoas, autor): Promise<number>`
  - `type ItemHistorico`, `listarHistorico(limite?: number): Promise<ItemHistorico[]>`
  - `POST /api/formularios/checklist-carregamento` → `201 { id }` | `422 { erros: ErroValidacao[] }` | `400/401/503/500 { error }`

- [ ] **Step 1: Teste (falhando)**

Create `src/lib/formularios/checklist.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({ prisma: {} }))

import { montarRegistro } from "./checklist"
import { EPIS, type ChecklistPayload, type PessoaSra } from "./regras"

const PESSOAS: PessoaSra[] = [
  { cpf: "111", nome: "Ana Souza", funcao: "OPERADOR LOGISTICO II" },
  { cpf: "222", nome: "Bruno Lima", funcao: "SUPERVISOR DE LOGISTICA" },
  { cpf: "333", nome: "Carla Dias", funcao: "OPERADOR LOGISTICO LIDER" },
]

const payload: ChecklistPayload = {
  operadores: ["111", "333"],
  inicioEm: "2026-09-11T07:30",
  fimEm: "2026-09-11T11:45",
  veiculoNumero: "1042",
  veiculoCapacidade: "28 t",
  lacres: ["A1"],
  epis: Object.fromEntries(EPIS.map((e) => [e.codigo, "sim"])) as ChecklistPayload["epis"],
  supervisorCpf: "222",
  liderCpf: "333",
  ocorrencia: "",
}

describe("montarRegistro", () => {
  it("grava foto de nome/função, horários em Brasília e uma resposta por EPI", () => {
    const r = montarRegistro(payload, PESSOAS, { usuarioId: 0, email: "x@y.com", nome: null })
    expect(r.criadoPorId).toBeNull()
    expect(r.inicioEm.toISOString()).toBe("2026-09-11T10:30:00.000Z")
    expect(r.supervisorNome).toBe("Bruno Lima")
    expect(r.liderFuncao).toBe("OPERADOR LOGISTICO LIDER")
    expect(r.ocorrencia).toBeNull()
    expect(r.operadores.create).toEqual([
      { cpf: "111", nome: "Ana Souza", funcao: "OPERADOR LOGISTICO II" },
      { cpf: "333", nome: "Carla Dias", funcao: "OPERADOR LOGISTICO LIDER" },
    ])
    expect(r.epis.create).toHaveLength(7)
    expect(r.epis.create[0]).toEqual({ epiCodigo: "luva", status: "sim" })
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- checklist`
Expected: FAIL — `Failed to resolve import "./checklist"`.

- [ ] **Step 3: Implementar persistência**

Create `src/lib/formularios/checklist.ts`:

```ts
import { prisma } from "@/lib/prisma"
import { EPIS, paraDataBrasilia, type ChecklistPayload, type EpiStatus, type PessoaSra } from "./regras"

export type Autor = { usuarioId: number; email: string; nome: string | null }

export type RegistroChecklist = {
  criadoPorId: number | null
  criadoPorEmail: string
  criadoPorNome: string | null
  inicioEm: Date
  fimEm: Date
  veiculoNumero: string
  veiculoCapacidade: string
  lacres: string[]
  supervisorCpf: string
  supervisorNome: string
  supervisorFuncao: string
  liderCpf: string
  liderNome: string
  liderFuncao: string
  ocorrencia: string | null
  operadores: { create: { cpf: string; nome: string; funcao: string | null }[] }
  epis: { create: { epiCodigo: string; status: EpiStatus }[] }
}

// Pré-condição: `validarChecklist(p, pessoas)` retornou []. Grava a FOTO de nome e
// função do dia (a SRA muda diariamente; o checklist não pode depender dela depois).
export function montarRegistro(p: ChecklistPayload, pessoas: PessoaSra[], autor: Autor): RegistroChecklist {
  const porCpf = new Map(pessoas.map((x) => [x.cpf, x]))
  const pessoa = (cpf: string) => porCpf.get(cpf) as PessoaSra
  const sup = pessoa(p.supervisorCpf)
  const lider = pessoa(p.liderCpf)
  return {
    criadoPorId: autor.usuarioId > 0 ? autor.usuarioId : null,
    criadoPorEmail: autor.email,
    criadoPorNome: autor.nome,
    inicioEm: paraDataBrasilia(p.inicioEm),
    fimEm: paraDataBrasilia(p.fimEm),
    veiculoNumero: p.veiculoNumero,
    veiculoCapacidade: p.veiculoCapacidade,
    lacres: p.lacres,
    supervisorCpf: sup.cpf,
    supervisorNome: sup.nome,
    supervisorFuncao: sup.funcao ?? "",
    liderCpf: lider.cpf,
    liderNome: lider.nome,
    liderFuncao: lider.funcao ?? "",
    ocorrencia: p.ocorrencia || null,
    operadores: {
      create: p.operadores.map((cpf) => {
        const o = pessoa(cpf)
        return { cpf: o.cpf, nome: o.nome, funcao: o.funcao }
      }),
    },
    epis: { create: EPIS.map((e) => ({ epiCodigo: e.codigo, status: p.epis[e.codigo] as EpiStatus })) },
  }
}

// Create aninhado = uma única transação no Prisma (cabeçalho + operadores + EPIs).
export async function salvarChecklist(p: ChecklistPayload, pessoas: PessoaSra[], autor: Autor): Promise<number> {
  const r = await prisma.ftAmyrisChecklistCarregamento.create({
    data: montarRegistro(p, pessoas, autor),
    select: { id: true },
  })
  return r.id
}

export type ItemHistorico = {
  id: number
  enviadoEm: string
  inicioEm: string
  fimEm: string
  veiculoNumero: string
  veiculoCapacidade: string
  qtdOperadores: number
  qtdLacres: number
  epis: { sim: number; na: number; nao: number }
  supervisorNome: string
  liderNome: string
  enviadoPor: string
  ocorrencia: string | null
}

// Envios de TODOS os usuários (conferência entre turnos), mais recentes primeiro.
export async function listarHistorico(limite = 50): Promise<ItemHistorico[]> {
  const linhas = await prisma.ftAmyrisChecklistCarregamento.findMany({
    orderBy: { enviadoEm: "desc" },
    take: limite,
    include: { operadores: { select: { id: true } }, epis: { select: { status: true } } },
  })
  return linhas.map((l) => ({
    id: l.id,
    enviadoEm: l.enviadoEm.toISOString(),
    inicioEm: l.inicioEm.toISOString(),
    fimEm: l.fimEm.toISOString(),
    veiculoNumero: l.veiculoNumero,
    veiculoCapacidade: l.veiculoCapacidade,
    qtdOperadores: l.operadores.length,
    qtdLacres: l.lacres.length,
    epis: {
      sim: l.epis.filter((e) => e.status === "sim").length,
      na: l.epis.filter((e) => e.status === "na").length,
      nao: l.epis.filter((e) => e.status === "nao").length,
    },
    supervisorNome: l.supervisorNome,
    liderNome: l.liderNome,
    enviadoPor: l.criadoPorNome ?? l.criadoPorEmail,
    ocorrencia: l.ocorrencia,
  }))
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS (regras + sra + checklist).

- [ ] **Step 5: Rota de envio**

Create `src/app/api/formularios/checklist-carregamento/route.ts`:

```ts
// POST /api/formularios/checklist-carregamento — grava um Checklist de Carregamento.
// Qualquer usuário logado no hub pode enviar. A validação REAL (inclusive cargos de
// supervisor/líder contra a SRA do momento) acontece aqui, não só na tela.
import { NextResponse } from "next/server"

import { requireSession } from "@/lib/auth-session"
import { salvarChecklist } from "@/lib/formularios/checklist"
import { normalizarPayload, validarChecklist, type PessoaSra } from "@/lib/formularios/regras"
import { getPessoasSra } from "@/lib/formularios/sra"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  let bruto: unknown
  try {
    bruto = await request.json()
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 })
  }
  const payload = normalizarPayload(bruto)

  let pessoas: PessoaSra[]
  try {
    pessoas = await getPessoasSra()
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar a escala agora. Tente de novo em instantes." },
      { status: 503 },
    )
  }

  const erros = validarChecklist(payload, pessoas)
  if (erros.length > 0) return NextResponse.json({ erros }, { status: 422 })

  const { authorization } = guard.sessao
  try {
    const id = await salvarChecklist(payload, pessoas, {
      usuarioId: authorization.usuarioId,
      email: authorization.email,
      nome: authorization.nome,
    })
    return NextResponse.json({ id }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Não foi possível salvar o checklist. Seus dados continuam no aparelho; tente enviar de novo." },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/lib/formularios/checklist.ts src/lib/formularios/checklist.test.ts src/app/api/formularios
git commit -m "feat: gravacao do checklist de carregamento e API de envio"
```

---

### Task 5: Shell mobile, proteção de rota, link na sidebar e tela 1A

**Files:**
- Modify: `src/middleware.ts`, `src/components/dashboard/DashboardSidebar.tsx`
- Create: `src/app/formularios/layout.tsx`, `src/app/formularios/page.tsx`, `src/components/formularios/MobileShell.tsx`, `src/components/formularios/BottomNav.tsx`, `src/components/formularios/ui.tsx`

**Interfaces:**
- Consumes: `getSessionReadOnly` (`@/lib/auth-session`), `nomeCurto` (Task 1), `AmyrisLogo` (`@/components/brand/AmyrisLogo`, prop `className`).
- Produces (usado nas Tasks 6 e 7), de `@/components/formularios/ui`: `GRAD`, `Cartao({ icone, titulo, subtitulo?, extra?, children })`, `Campo({ rotulo, erro?, children })`, `classeInput`, `MensagemErro({ texto })`.

- [ ] **Step 1: Proteger `/formularios` no middleware**

Em `src/middleware.ts`:
- `const protectedRoutes = ["/dashboards"]` → `const protectedRoutes = ["/dashboards", "/formularios"]`
- `matcher: ["/dashboards/:path*", "/login"]` → `matcher: ["/dashboards/:path*", "/formularios/:path*", "/login"]`

- [ ] **Step 2: Peças visuais comuns**

Create `src/components/formularios/ui.tsx` (valores copiados do design `docs/design/checklist-carregamento-mobile.dc.html`; ao implementar, confira cada cor/sombra com o `style` do elemento equivalente no artboard `1b`):

```tsx
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export const GRAD = "linear-gradient(135deg,#4B0085 0%,#7C3AED 55%,#A78BFA 100%)"

export const classeInput =
  "h-11 w-full rounded-xl border border-[#E7DEED] bg-white px-3 text-[15px] text-[#201429] outline-none transition placeholder:text-[#B5A9C4] focus:border-[rgba(75,0,133,.5)] focus:shadow-[0_0_0_3px_rgba(75,0,133,.16)]"

export function Cartao({
  icone: Icone,
  titulo,
  subtitulo,
  extra,
  children,
}: {
  icone: LucideIcon
  titulo: string
  subtitulo?: string
  extra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-[#EDE4F5] bg-white p-4 shadow-[0_1px_2px_rgba(26,11,46,.04),0_12px_28px_-18px_rgba(75,0,133,.25)]">
      <header className="mb-3 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F4F0FB] text-[#4B0085]">
          <Icone className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-semibold text-[#201429]">{titulo}</p>
          {subtitulo && <p className="text-xs text-[#8F82A0]">{subtitulo}</p>}
        </div>
        {extra}
      </header>
      {children}
    </section>
  )
}

export function MensagemErro({ texto }: { texto?: string }) {
  if (!texto) return null
  return <p className="mt-1.5 text-xs font-medium text-[#C42B2B]">{texto}</p>
}

export function Campo({ rotulo, erro, children }: { rotulo: string; erro?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#5B4E6B]">{rotulo}</span>
      {children}
      <MensagemErro texto={erro} />
    </label>
  )
}

export function Pilula({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full bg-[#F4F0FB] px-2.5 py-1 text-xs font-semibold text-[#4B0085]", className)}
      {...props}
    />
  )
}
```

- [ ] **Step 3: Shell e navegação inferior**

Create `src/components/formularios/BottomNav.tsx`:

```tsx
"use client"

import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, ClipboardList, Home, LogOut } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [saindo, setSaindo] = useState(false)

  async function sair() {
    setSaindo(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      router.replace("/login")
    }
  }

  const item = "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition"
  const naLista = pathname === "/formularios"

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[430px] gap-1 border-t border-[#EDE4F5] bg-white/95 px-3 pt-2 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur">
      <button type="button" onClick={() => router.back()} className={cn(item, "text-[#8F82A0] hover:bg-[#F4F0FB] hover:text-[#4B0085]")}>
        <ArrowLeft className="h-5 w-5" /> Voltar
      </button>
      <button type="button" onClick={() => router.push("/dashboards")} className={cn(item, "text-[#8F82A0] hover:bg-[#F4F0FB] hover:text-[#4B0085]")}>
        <Home className="h-5 w-5" /> Início
      </button>
      <button
        type="button"
        onClick={() => router.push("/formularios")}
        className={cn(item, naLista ? "bg-[#F4F0FB] text-[#4B0085]" : "text-[#8F82A0] hover:bg-[#F4F0FB] hover:text-[#4B0085]")}
      >
        <ClipboardList className="h-5 w-5" /> Formulários
      </button>
      <button
        type="button"
        onClick={sair}
        disabled={saindo}
        className={cn(item, "text-[#8F82A0] hover:bg-[rgba(217,45,45,.08)] hover:text-[#C42B2B] disabled:opacity-60")}
      >
        <LogOut className="h-5 w-5" /> Sair
      </button>
    </nav>
  )
}
```

Create `src/components/formularios/MobileShell.tsx`:

```tsx
import { UserRound } from "lucide-react"
import { AmyrisLogo } from "@/components/brand/AmyrisLogo"
import { nomeCurto } from "@/lib/formularios/regras"
import { BottomNav } from "./BottomNav"

export function MobileShell({ nome, children }: { nome: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#EFE9F7]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#FBF9FE]">
        <header className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),16px)] pb-3">
          <div className="flex items-center gap-2">
            <AmyrisLogo className="h-6" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8F82A0]">Hub</span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#EDE4F5] bg-white py-1 pl-1 pr-3 text-xs font-semibold text-[#201429]">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#F4F0FB] text-[#4B0085]">
              <UserRound className="h-3.5 w-3.5" />
            </span>
            {nomeCurto(nome)}
          </span>
        </header>
        <main className="flex-1 px-5 pb-40">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}
```

Create `src/app/formularios/layout.tsx`:

```tsx
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { MobileShell } from "@/components/formularios/MobileShell"
import { getSessionReadOnly } from "@/lib/auth-session"

export default async function FormulariosLayout({ children }: { children: React.ReactNode }) {
  // Server Component não grava cookies — mesma checagem somente leitura dos dashboards.
  const resultado = await getSessionReadOnly()
  if (resultado.status === "anonimo") redirect("/login?next=/formularios")
  if (resultado.status === "renovar") {
    const path = headers().get("x-invoke-path") ?? "/formularios"
    redirect(`/api/auth/refresh?next=${encodeURIComponent(path)}`)
  }
  const { authorization } = resultado.sessao
  return <MobileShell nome={authorization.nome ?? authorization.email}>{children}</MobileShell>
}
```

- [ ] **Step 4: Tela 1A — lista de formulários**

Create `src/app/formularios/page.tsx` (layout do artboard `1a` do design: eyebrow "Registros da operação", título "Formulários", card grande com gradiente/`pulseGlow` para Carregamento, cards esmaecidos "Em breve"):

```tsx
import Link from "next/link"
import { ChevronRight, ClipboardCheck, HardHat, History, Lock, ShieldAlert, Sparkles, Truck } from "lucide-react"
import { GRAD } from "@/components/formularios/ui"

const EM_BREVE = [
  { grupo: "Ronda", titulo: "Inspeção Veicular", icone: ClipboardCheck },
  { grupo: "Segurança", titulo: "Inspeção de EPI", icone: HardHat },
  { grupo: "Segurança", titulo: "Registro de Ocorrência", icone: ShieldAlert },
]

export default function FormulariosPage() {
  return (
    <div className="space-y-6 pt-2">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F0FB] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4B0085]">
          <Sparkles className="h-3.5 w-3.5" /> Registros da operação
        </span>
        <h1 className="mt-3 font-display text-[28px] font-semibold tracking-tight text-[#201429]">Formulários</h1>
        <p className="mt-1 text-sm text-[#6B5E7B]">
          Escolha o registro que vai preencher. Os dados alimentam os indicadores do hub.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8F82A0]">Disponível agora</p>
        <Link
          href="/formularios/carregamento"
          className="relative flex items-center gap-3 overflow-hidden rounded-2xl p-4 text-white shadow-[0_0_0_1px_rgba(124,58,237,.14),0_14px_34px_-16px_rgba(75,0,133,.45)] transition active:scale-[.985]"
          style={{ background: GRAD }}
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
            <Truck className="h-5 w-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">Ronda</span>
            <span className="font-display text-lg font-semibold">Carregamento</span>
            <span className="text-xs text-white/80">Equipe, EPIs, veículo e lacres</span>
          </span>
          <ChevronRight className="h-5 w-5 text-white/80" />
        </Link>
        <Link
          href="/formularios/historico"
          className="flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold text-[#4B0085] hover:bg-[#F4F0FB]"
        >
          <History className="h-4 w-4" /> Histórico de envios
        </Link>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8F82A0]">Em breve</p>
        {EM_BREVE.map(({ grupo, titulo, icone: Icone }) => (
          <div key={titulo} className="flex items-center gap-3 rounded-2xl border border-[#EDE4F5] bg-white/70 p-4 opacity-80">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F4F0FB] text-[#A99BBB]">
              <Icone className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A99BBB]">{grupo}</span>
              <span className="font-display font-semibold text-[#5B4E6B]">{titulo}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F0FB] px-2 py-1 text-[10px] font-semibold text-[#8F82A0]">
              <Lock className="h-3 w-3" /> Em breve
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Link "Formulários" na sidebar do hub**

Em `src/components/dashboard/DashboardSidebar.tsx`:
- Adicionar `ClipboardList,` ao import de `lucide-react`.
- Em `GROUPS`, logo após o grupo `"Geral"`, inserir:

```ts
  {
    title: "Registros",
    items: [{ href: "/formularios", label: "Formulários", icon: ClipboardList }],
  },
```

(`/formularios` não está em `HUB_SCREENS`, então `podeVerItem` o mostra para todos — comportamento desejado.)

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit`
Expected: sem erros. Depois `npm run dev`, abrir `http://localhost:3000/formularios` logado em viewport 390×844: lista igual ao artboard `1a`, bottom-nav funcionando (Formulários ativo; Início vai para `/dashboards`; Sair desloga). Deslogado: redireciona para `/login`.

- [ ] **Step 7: Commit**

```bash
git add src/middleware.ts src/components/dashboard/DashboardSidebar.tsx src/app/formularios/layout.tsx src/app/formularios/page.tsx src/components/formularios
git commit -m "feat: shell mobile de formularios, lista de formularios e link na sidebar"
```

---

### Task 6: Wizard do Checklist de Carregamento (1B)

**Files:**
- Create: `src/app/formularios/carregamento/page.tsx`, `src/components/formularios/useRascunho.ts`, `ChecklistWizard.tsx`, `EtapaEquipe.tsx`, `EtapaEpis.tsx`, `EtapaVeiculo.tsx`, `EtapaResponsaveis.tsx`, `OperadoresSheet.tsx`, `ConfirmacaoEnvio.tsx` (todos em `src/components/formularios/`)

**Interfaces:**
- Consumes: tudo de `regras` (Task 1), `getPessoasSra` (Task 3), `POST /api/formularios/checklist-carregamento` (Task 4), `Cartao/Campo/classeInput/MensagemErro/GRAD/Pilula` (Task 5).
- Produces: `ChecklistWizard({ pessoas: PessoaSra[]; usuarioChave: string; erroSra: boolean })`; `type EstadoChecklist = ChecklistPayload & { etapa: 1|2|3|4 }` exportado de `ChecklistWizard.tsx`; `type Erros = Partial<Record<CampoChecklist, string>>`.

- [ ] **Step 1: Página servidor**

Create `src/app/formularios/carregamento/page.tsx`:

```tsx
import { ChecklistWizard } from "@/components/formularios/ChecklistWizard"
import { getSessionReadOnly } from "@/lib/auth-session"
import type { PessoaSra } from "@/lib/formularios/regras"
import { getPessoasSra } from "@/lib/formularios/sra"

export const dynamic = "force-dynamic"

export default async function CarregamentoPage() {
  const sessao = await getSessionReadOnly()
  const a = sessao.status === "ok" ? sessao.sessao.authorization : null
  const usuarioChave = a ? String(a.usuarioId || a.email) : "anonimo"

  let pessoas: PessoaSra[] = []
  let erroSra = false
  try {
    pessoas = await getPessoasSra()
  } catch {
    erroSra = true
  }
  return <ChecklistWizard pessoas={pessoas} usuarioChave={usuarioChave} erroSra={erroSra} />
}
```

- [ ] **Step 2: Rascunho no aparelho**

Create `src/components/formularios/useRascunho.ts`:

```ts
"use client"

import { useCallback } from "react"

// Rascunho em localStorage (por usuário). localStorage pode lançar (modo privado,
// armazenamento cheio): toda leitura/escrita é protegida e falha em silêncio.
export function useRascunho<T>(chave: string) {
  const ler = useCallback((): T | null => {
    try {
      const s = window.localStorage.getItem(chave)
      return s ? (JSON.parse(s) as T) : null
    } catch {
      return null
    }
  }, [chave])
  const salvar = useCallback(
    (valor: T) => {
      try {
        window.localStorage.setItem(chave, JSON.stringify(valor))
      } catch {}
    },
    [chave],
  )
  const limpar = useCallback(() => {
    try {
      window.localStorage.removeItem(chave)
    } catch {}
  }, [chave])
  return { ler, salvar, limpar }
}
```

- [ ] **Step 3: Bottom-sheet de operadores (portal + fixed)**

Create `src/components/formularios/OperadoresSheet.tsx`:

```tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Check, Search, X } from "lucide-react"
import { formatarFuncao, iniciais, type PessoaSra } from "@/lib/formularios/regras"
import { GRAD } from "./ui"

export function OperadoresSheet({
  aberto,
  pessoas,
  selecionados,
  onAlternar,
  onFechar,
}: {
  aberto: boolean
  pessoas: PessoaSra[]
  selecionados: string[]
  onAlternar: (cpf: string) => void
  onFechar: () => void
}) {
  const [busca, setBusca] = useState("")
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  useEffect(() => {
    if (aberto) setBusca("")
  }, [aberto])

  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? pessoas.filter((p) => p.nome.toLowerCase().includes(q)) : pessoas
  }, [busca, pessoas])

  if (!montado || !aberto) return null
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[rgba(26,11,46,.45)]" onClick={onFechar} />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[82dvh] w-full max-w-[430px] flex-col rounded-t-3xl bg-white px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)] shadow-[0_-20px_50px_-20px_rgba(26,11,46,.5)]">
        <span className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#E7DEED]" />
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-[#201429]">Operadores da SRA</p>
            <p className="text-xs text-[#8F82A0]">Todos os ativos do CR · toque para adicionar</p>
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="grid h-9 w-9 place-items-center rounded-full bg-[#F4F0FB] text-[#4B0085]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A99BBB]" />
          <input
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome…"
            className="h-11 w-full rounded-xl border border-[#E7DEED] bg-[#FBF9FE] pl-9 pr-3 text-[15px] outline-none focus:border-[rgba(75,0,133,.5)] focus:shadow-[0_0_0_3px_rgba(75,0,133,.16)]"
          />
        </div>
        <div className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1 pb-2">
          {resultados.length === 0 && <p className="py-6 text-center text-sm text-[#8F82A0]">Ninguém encontrado.</p>}
          {resultados.map((p) => {
            const on = selecionados.includes(p.cpf)
            return (
              <button
                key={p.cpf}
                type="button"
                onClick={() => onAlternar(p.cpf)}
                className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition"
                style={{ background: on ? "#F7F3FD" : "#fff", borderColor: on ? "rgba(124,58,237,.35)" : "#E7DEED" }}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#F4F0FB] text-sm font-bold text-[#4B0085]">
                  {iniciais(p.nome)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-[#201429]">{p.nome}</span>
                  <span className="truncate text-xs text-[#8F82A0]">{formatarFuncao(p.funcao)}</span>
                </span>
                <span
                  className="grid h-7 w-7 place-items-center rounded-full"
                  style={{ background: on ? GRAD : "#F1EBF8", color: on ? "#fff" : "#CFC4DA" }}
                >
                  <Check className="h-4 w-4" />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}
```

- [ ] **Step 4: As 4 etapas**

Create `src/components/formularios/EtapaEquipe.tsx`:

```tsx
"use client"

import { CalendarClock, Plus, Users, X } from "lucide-react"
import { formatarFuncao, iniciais, type PessoaSra } from "@/lib/formularios/regras"
import type { Erros } from "./ChecklistWizard"
import { Campo, Cartao, MensagemErro, Pilula, classeInput } from "./ui"

export function EtapaEquipe({
  operadores,
  inicioEm,
  fimEm,
  erros,
  onRemover,
  onAbrirBusca,
  onMudar,
}: {
  operadores: PessoaSra[]
  inicioEm: string
  fimEm: string
  erros: Erros
  onRemover: (cpf: string) => void
  onAbrirBusca: () => void
  onMudar: (campo: "inicioEm" | "fimEm", valor: string) => void
}) {
  return (
    <div className="space-y-4">
      <Cartao icone={Users} titulo="Operadores" subtitulo="Da escala da SRA" extra={<Pilula>{operadores.length}</Pilula>}>
        <div className="space-y-2">
          {operadores.map((o) => (
            <div key={o.cpf} className="flex items-center gap-3 rounded-xl border border-[#EDE4F5] bg-[#FBF9FE] p-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F4F0FB] text-xs font-bold text-[#4B0085]">{iniciais(o.nome)}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold text-[#201429]">{o.nome}</span>
                <span className="truncate text-xs text-[#8F82A0]">{formatarFuncao(o.funcao)}</span>
              </span>
              <button
                type="button"
                onClick={() => onRemover(o.cpf)}
                aria-label={`Remover ${o.nome}`}
                className="grid h-8 w-8 place-items-center rounded-full text-[#A99BBB] hover:bg-[rgba(217,45,45,.08)] hover:text-[#C42B2B]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onAbrirBusca}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D9CCEA] text-sm font-semibold text-[#4B0085] hover:border-[#7C3AED] hover:bg-[#F4F0FB]"
          >
            <Plus className="h-4 w-4" /> Adicionar operador
          </button>
          <MensagemErro texto={erros.operadores} />
        </div>
      </Cartao>

      <Cartao icone={CalendarClock} titulo="Período da atividade" subtitulo="Data e hora de início e fim">
        <div className="grid gap-3">
          <Campo rotulo="Data/hora início" erro={erros.inicioEm}>
            <input type="datetime-local" value={inicioEm} onChange={(e) => onMudar("inicioEm", e.target.value)} className={classeInput} />
          </Campo>
          <Campo rotulo="Data/hora fim" erro={erros.fimEm}>
            <input type="datetime-local" value={fimEm} onChange={(e) => onMudar("fimEm", e.target.value)} className={classeInput} />
          </Campo>
        </div>
      </Cartao>
    </div>
  )
}
```

Create `src/components/formularios/EtapaEpis.tsx`:

```tsx
"use client"

import { CheckCircle2, ShieldCheck } from "lucide-react"
import { EPIS, resumoEpis, type ChecklistPayload, type EpiCodigo, type EpiStatus } from "@/lib/formularios/regras"
import type { Erros } from "./ChecklistWizard"
import { GRAD, MensagemErro } from "./ui"

const OPCOES: { valor: EpiStatus; rotulo: string }[] = [
  { valor: "sim", rotulo: "Sim" },
  { valor: "na", rotulo: "N/A" },
  { valor: "nao", rotulo: "Não" },
]

function estilo(ativo: boolean, valor: EpiStatus): React.CSSProperties {
  if (!ativo) return { background: "transparent", color: "#8F82A0" }
  if (valor === "sim") return { background: GRAD, color: "#fff", boxShadow: "0 8px 18px -10px rgba(75,0,133,.9)" }
  if (valor === "na") return { background: "#fff", color: "#4B0085", boxShadow: "0 1px 3px rgba(26,11,46,.12)" }
  return { background: "#C42B2B", color: "#fff", boxShadow: "0 8px 18px -10px rgba(196,43,43,.9)" }
}

export function EtapaEpis({
  epis,
  qtdOperadores,
  erros,
  onMarcar,
}: {
  epis: ChecklistPayload["epis"]
  qtdOperadores: number
  erros: Erros
  onMarcar: (codigo: EpiCodigo, valor: EpiStatus | null) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl bg-[#F4F0FB] p-3 text-sm text-[#4B0085]">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          <strong>Verificação da equipe.</strong> Vale para os {qtdOperadores} operadores da lista.
        </p>
      </div>
      <div className="divide-y divide-[#F1EBF8] rounded-2xl border border-[#EDE4F5] bg-white">
        {EPIS.map((e) => (
          <div key={e.codigo} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm font-semibold text-[#201429]">{e.nome}</span>
            <span className="flex rounded-full bg-[#F6F2FB] p-1">
              {OPCOES.map((o) => {
                const ativo = epis[e.codigo] === o.valor
                return (
                  <button
                    key={o.valor}
                    type="button"
                    onClick={() => onMarcar(e.codigo, ativo ? null : o.valor)}
                    className="min-w-[46px] rounded-full px-3 py-1.5 text-xs font-bold transition"
                    style={estilo(ativo, o.valor)}
                  >
                    {o.rotulo}
                  </button>
                )
              })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold text-[#4B0085]">
        <CheckCircle2 className="h-4 w-4" /> {resumoEpis(epis)}
      </div>
      <MensagemErro texto={erros.epis} />
    </div>
  )
}
```

Create `src/components/formularios/EtapaVeiculo.tsx`:

```tsx
"use client"

import { Lock, Plus, Trash2, Truck } from "lucide-react"
import { MAX_LACRES } from "@/lib/formularios/regras"
import type { Erros } from "./ChecklistWizard"
import { Campo, Cartao, MensagemErro, classeInput } from "./ui"

export function EtapaVeiculo({
  veiculoNumero,
  veiculoCapacidade,
  lacres,
  erros,
  onMudar,
  onLacres,
}: {
  veiculoNumero: string
  veiculoCapacidade: string
  lacres: string[]
  erros: Erros
  onMudar: (campo: "veiculoNumero" | "veiculoCapacidade", valor: string) => void
  onLacres: (lacres: string[]) => void
}) {
  return (
    <div className="space-y-4">
      <Cartao icone={Truck} titulo="Veículo">
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="N° do veículo" erro={erros.veiculoNumero}>
            <input value={veiculoNumero} onChange={(e) => onMudar("veiculoNumero", e.target.value)} placeholder="Ex. 1042" className={classeInput} />
          </Campo>
          <Campo rotulo="Capacidade" erro={erros.veiculoCapacidade}>
            <input value={veiculoCapacidade} onChange={(e) => onMudar("veiculoCapacidade", e.target.value)} placeholder="Ex. 28 t" className={classeInput} />
          </Campo>
        </div>
      </Cartao>

      <Cartao icone={Lock} titulo="Lacres" subtitulo={`Até ${MAX_LACRES} · adicione conforme o uso`}>
        <div className="space-y-3">
          {lacres.map((valor, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <Campo rotulo={`Lacre ${i + 1}`}>
                  <input
                    value={valor}
                    onChange={(e) => onLacres(lacres.map((l, j) => (j === i ? e.target.value : l)))}
                    placeholder="Número do lacre"
                    className={classeInput}
                  />
                </Campo>
              </div>
              <button
                type="button"
                onClick={() => onLacres(lacres.filter((_, j) => j !== i))}
                aria-label={`Remover lacre ${i + 1}`}
                className="grid h-11 w-11 place-items-center rounded-xl border border-[#E7DEED] text-[#A99BBB] hover:border-[rgba(196,43,43,.3)] hover:bg-[rgba(217,45,45,.06)] hover:text-[#C42B2B]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {lacres.length < MAX_LACRES && (
            <button
              type="button"
              onClick={() => onLacres([...lacres, ""])}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D9CCEA] text-sm font-semibold text-[#4B0085] hover:border-[#7C3AED] hover:bg-[#F4F0FB]"
            >
              <Plus className="h-4 w-4" /> Adicionar lacre
            </button>
          )}
          <MensagemErro texto={erros.lacres} />
        </div>
      </Cartao>
    </div>
  )
}
```

Create `src/components/formularios/EtapaResponsaveis.tsx`:

```tsx
"use client"

import { MessageSquareWarning, UserCheck } from "lucide-react"
import { EPIS, formatarFuncao, podeSerLider, podeSerSupervisor, resumoEpis, type ChecklistPayload, type PessoaSra } from "@/lib/formularios/regras"
import type { Erros } from "./ChecklistWizard"
import { Campo, Cartao, MensagemErro, Pilula, classeInput } from "./ui"

export function EtapaResponsaveis({
  pessoas,
  estado,
  erros,
  onMudar,
}: {
  pessoas: PessoaSra[]
  estado: ChecklistPayload
  erros: Erros
  onMudar: (campo: "supervisorCpf" | "liderCpf" | "ocorrencia", valor: string) => void
}) {
  const supervisores = pessoas.filter(podeSerSupervisor)
  const lideres = pessoas.filter(podeSerLider)
  const temNao = EPIS.some((e) => estado.epis[e.codigo] === "nao")
  const lacresPreenchidos = estado.lacres.filter((l) => l.trim()).length

  return (
    <div className="space-y-4">
      <Cartao icone={UserCheck} titulo="Responsáveis" subtitulo="Cargos validados na SRA">
        <div className="space-y-3">
          <Campo rotulo="Supervisor responsável" erro={erros.supervisorCpf}>
            <select value={estado.supervisorCpf} onChange={(e) => onMudar("supervisorCpf", e.target.value)} className={classeInput}>
              <option value="">{supervisores.length ? "Selecione…" : "Nenhum Supervisor de Logística ativo hoje"}</option>
              {supervisores.map((p) => (
                <option key={p.cpf} value={p.cpf}>
                  {p.nome} · {formatarFuncao(p.funcao)}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Líder responsável" erro={erros.liderCpf}>
            <select value={estado.liderCpf} onChange={(e) => onMudar("liderCpf", e.target.value)} className={classeInput}>
              <option value="">{lideres.length ? "Selecione…" : "Nenhum Operador Logístico Líder ativo hoje"}</option>
              {lideres.map((p) => (
                <option key={p.cpf} value={p.cpf}>
                  {p.nome} · {formatarFuncao(p.funcao)}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </Cartao>

      <Cartao
        icone={MessageSquareWarning}
        titulo="Ocorrência"
        subtitulo={temNao ? "Obrigatória · algum EPI ficou como \"Não\"" : "Opcional · texto livre"}
      >
        <textarea
          rows={4}
          value={estado.ocorrencia}
          onChange={(e) => onMudar("ocorrencia", e.target.value)}
          placeholder="Descreva qualquer desvio, atraso ou intercorrência do carregamento…"
          className={`${classeInput} h-auto py-2.5`}
        />
        <MensagemErro texto={erros.ocorrencia} />
      </Cartao>

      <div className="rounded-2xl border border-[#EDE4F5] bg-[#FBF9FE] p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8F82A0]">Resumo</p>
        <div className="flex flex-wrap gap-2">
          <Pilula>{estado.operadores.length} operadores</Pilula>
          <Pilula>{resumoEpis(estado.epis)}</Pilula>
          <Pilula>{lacresPreenchidos} lacres</Pilula>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Confirmação**

Create `src/components/formularios/ConfirmacaoEnvio.tsx`:

```tsx
"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { GRAD } from "./ui"

export function ConfirmacaoEnvio({ id, onNovo }: { id: number; onNovo: () => void }) {
  return (
    <div className="flex flex-col items-center pt-12 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full text-white shadow-[0_20px_46px_-14px_rgba(75,0,133,.62)]" style={{ background: GRAD }}>
        <CheckCircle2 className="h-10 w-10" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold text-[#201429]">Checklist enviado</h1>
      <p className="mt-1 text-sm text-[#6B5E7B]">Registro nº {id} salvo com sucesso.</p>
      <div className="mt-8 grid w-full gap-3">
        <button type="button" onClick={onNovo} className="h-12 rounded-2xl font-semibold text-white" style={{ background: GRAD }}>
          Novo checklist
        </button>
        <Link href="/formularios/historico" className="grid h-12 place-items-center rounded-2xl border border-[#E7DEED] bg-white font-semibold text-[#4B0085]">
          Ver histórico
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: O wizard**

Create `src/components/formularios/ChecklistWizard.tsx`:

```tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, ChevronLeft, Loader2 } from "lucide-react"
import {
  etapaDoCampo,
  validarChecklist,
  type CampoChecklist,
  type ChecklistPayload,
  type ErroValidacao,
  type PessoaSra,
} from "@/lib/formularios/regras"
import { ConfirmacaoEnvio } from "./ConfirmacaoEnvio"
import { EtapaEpis } from "./EtapaEpis"
import { EtapaEquipe } from "./EtapaEquipe"
import { EtapaResponsaveis } from "./EtapaResponsaveis"
import { EtapaVeiculo } from "./EtapaVeiculo"
import { OperadoresSheet } from "./OperadoresSheet"
import { GRAD } from "./ui"
import { useRascunho } from "./useRascunho"

type Etapa = 1 | 2 | 3 | 4
export type EstadoChecklist = ChecklistPayload & { etapa: Etapa }
export type Erros = Partial<Record<CampoChecklist, string>>

const TITULOS = ["Equipe e período", "EPIs da equipe", "Veículo e lacres", "Responsáveis"]
const ABAS = ["Equipe", "EPIs", "Veículo", "Fecho"]

const VAZIO: EstadoChecklist = {
  etapa: 1,
  operadores: [],
  inicioEm: "",
  fimEm: "",
  veiculoNumero: "",
  veiculoCapacidade: "",
  lacres: [],
  epis: {},
  supervisorCpf: "",
  liderCpf: "",
  ocorrencia: "",
}

function paraPayload(e: EstadoChecklist): ChecklistPayload {
  const { etapa: _etapa, ...resto } = e
  return { ...resto, lacres: resto.lacres.map((l) => l.trim()).filter(Boolean), ocorrencia: resto.ocorrencia.trim() }
}

function temConteudo(e: EstadoChecklist) {
  return (
    e.operadores.length > 0 || !!e.inicioEm || !!e.veiculoNumero || Object.values(e.epis).some(Boolean) || !!e.ocorrencia
  )
}

const mapaErros = (lista: ErroValidacao[]): Erros => Object.fromEntries(lista.map((e) => [e.campo, e.mensagem]))

export function ChecklistWizard({
  pessoas,
  usuarioChave,
  erroSra,
}: {
  pessoas: PessoaSra[]
  usuarioChave: string
  erroSra: boolean
}) {
  // Desestruturado: os callbacks são estáveis (useCallback); o objeto retornado não é,
  // e usá-lo como dependência de useEffect causaria loop de renderização.
  const rascunho = useRascunho<EstadoChecklist>(`amyris:rascunho:checklist-carregamento:${usuarioChave}`)
  const { ler, salvar, limpar } = rascunho // não usar `rascunho.*` direto
  const [estado, setEstado] = useState<EstadoChecklist>(VAZIO)
  const [oferta, setOferta] = useState<EstadoChecklist | null>(null)
  const [pronto, setPronto] = useState(false)
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [errosServidor, setErrosServidor] = useState<Erros>({})
  const [falhaEnvio, setFalhaEnvio] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviadoId, setEnviadoId] = useState<number | null>(null)

  const porCpf = useMemo(() => new Map(pessoas.map((p) => [p.cpf, p])), [pessoas])

  // Oferece retomar o rascunho salvo (descarta pessoas que saíram da escala).
  useEffect(() => {
    const salvo = ler()
    if (salvo && temConteudo(salvo)) {
      setOferta({ ...VAZIO, ...salvo, operadores: salvo.operadores.filter((c) => porCpf.has(c)) })
    }
    setPronto(true)
  }, [ler, porCpf])

  // Auto-save a cada mudança (não sobrescreve o rascunho enquanto a oferta está aberta).
  useEffect(() => {
    if (pronto && !oferta && enviadoId === null && temConteudo(estado)) salvar(estado)
  }, [estado, pronto, oferta, enviadoId, salvar])

  const payload = paraPayload(estado)
  const erros: Erros = tentouEnviar ? { ...mapaErros(validarChecklist(payload, pessoas)), ...errosServidor } : {}

  function mudar<K extends keyof EstadoChecklist>(campo: K, valor: EstadoChecklist[K]) {
    setErrosServidor({})
    setEstado((s) => ({ ...s, [campo]: valor }))
  }
  const irPara = (etapa: Etapa) => setEstado((s) => ({ ...s, etapa }))

  async function enviar() {
    setTentouEnviar(true)
    setFalhaEnvio(null)
    const locais = validarChecklist(payload, pessoas)
    if (locais.length > 0) {
      irPara(etapaDoCampo(locais[0].campo))
      return
    }
    setEnviando(true)
    try {
      const r = await fetch("/api/formularios/checklist-carregamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const corpo = await r.json().catch(() => ({}))
      if (r.status === 201) {
        limpar()
        setEnviadoId(corpo.id as number)
        return
      }
      if (r.status === 422 && Array.isArray(corpo.erros) && corpo.erros.length > 0) {
        setErrosServidor(mapaErros(corpo.erros as ErroValidacao[]))
        irPara(etapaDoCampo((corpo.erros as ErroValidacao[])[0].campo))
        return
      }
      if (r.status === 401) {
        setFalhaEnvio("Sua sessão expirou. Entre de novo — o preenchimento continua salvo no aparelho.")
        return
      }
      setFalhaEnvio(typeof corpo.error === "string" ? corpo.error : "Não foi possível enviar. Tente de novo.")
    } catch {
      setFalhaEnvio("Sem conexão. Seus dados estão salvos no aparelho — tente enviar de novo quando o sinal voltar.")
    } finally {
      setEnviando(false)
    }
  }

  function novo() {
    setEstado(VAZIO)
    setTentouEnviar(false)
    setErrosServidor({})
    setEnviadoId(null)
  }

  if (enviadoId !== null) return <ConfirmacaoEnvio id={enviadoId} onNovo={novo} />

  const etapa = estado.etapa
  const operadores = estado.operadores.map((c) => porCpf.get(c)).filter((p): p is PessoaSra => !!p)

  return (
    <div className="pt-1">
      {erroSra && (
        <p className="mb-3 rounded-xl bg-[rgba(217,45,45,.08)] p-3 text-sm font-medium text-[#C42B2B]">
          Não foi possível carregar a escala agora. Recarregue a página em instantes.
        </p>
      )}

      {oferta && (
        <div className="mb-4 rounded-2xl border border-[rgba(124,58,237,.35)] bg-[#F7F3FD] p-4">
          <p className="text-sm font-semibold text-[#201429]">Retomar preenchimento?</p>
          <p className="text-xs text-[#6B5E7B]">Há um checklist não enviado salvo neste aparelho.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => { setEstado(oferta); setOferta(null) }} className="h-9 flex-1 rounded-xl text-sm font-semibold text-white" style={{ background: GRAD }}>
              Retomar
            </button>
            <button type="button" onClick={() => { limpar(); setOferta(null) }} className="h-9 flex-1 rounded-xl border border-[#E7DEED] bg-white text-sm font-semibold text-[#5B4E6B]">
              Descartar
            </button>
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => irPara(Math.max(1, etapa - 1) as Etapa)} aria-label="Etapa anterior" className="grid h-10 w-10 place-items-center rounded-full border border-[#EDE4F5] bg-white text-[#4B0085] hover:bg-[#F4F0FB]">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8F82A0]">Ronda · Carregamento</p>
          <h1 className="font-display text-xl font-semibold text-[#201429]">{TITULOS[etapa - 1]}</h1>
        </div>
        <span className="text-sm font-semibold text-[#8F82A0]">
          <span className="text-[#4B0085]">{etapa}</span>/4
        </span>
      </div>

      <div className="mb-2 grid grid-cols-4 gap-1.5">
        {ABAS.map((rotulo, i) => {
          const n = (i + 1) as Etapa
          const atual = etapa === n
          return (
            <button
              key={rotulo}
              type="button"
              onClick={() => irPara(n)}
              className="h-9 rounded-xl text-xs font-bold transition"
              style={{
                background: atual ? GRAD : etapa > n ? "#EDE4F8" : "#F6F2FB",
                color: atual ? "#fff" : etapa > n ? "#4B0085" : "#8F82A0",
                boxShadow: atual ? "0 10px 22px -12px rgba(75,0,133,.85)" : "none",
              }}
            >
              {rotulo}
            </button>
          )
        })}
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[#F1EBF8]">
        <div className="h-full rounded-full transition-all" style={{ width: `${etapa * 25}%`, background: GRAD }} />
      </div>

      {etapa === 1 && (
        <EtapaEquipe
          operadores={operadores}
          inicioEm={estado.inicioEm}
          fimEm={estado.fimEm}
          erros={erros}
          onRemover={(cpf) => mudar("operadores", estado.operadores.filter((c) => c !== cpf))}
          onAbrirBusca={() => setBuscaAberta(true)}
          onMudar={(campo, valor) => mudar(campo, valor)}
        />
      )}
      {etapa === 2 && (
        <EtapaEpis
          epis={estado.epis}
          qtdOperadores={estado.operadores.length}
          erros={erros}
          onMarcar={(codigo, valor) => mudar("epis", { ...estado.epis, [codigo]: valor })}
        />
      )}
      {etapa === 3 && (
        <EtapaVeiculo
          veiculoNumero={estado.veiculoNumero}
          veiculoCapacidade={estado.veiculoCapacidade}
          lacres={estado.lacres}
          erros={erros}
          onMudar={(campo, valor) => mudar(campo, valor)}
          onLacres={(lacres) => mudar("lacres", lacres)}
        />
      )}
      {etapa === 4 && (
        <EtapaResponsaveis pessoas={pessoas} estado={payload} erros={erros} onMudar={(campo, valor) => mudar(campo, valor)} />
      )}

      {falhaEnvio && <p className="mt-4 rounded-xl bg-[rgba(217,45,45,.08)] p-3 text-sm font-medium text-[#C42B2B]">{falhaEnvio}</p>}

      <div className="fixed inset-x-0 bottom-[76px] z-20 mx-auto w-full max-w-[430px] bg-gradient-to-t from-[#FBF9FE] via-[#FBF9FE] to-transparent px-5 pb-3 pt-6">
        <button
          type="button"
          disabled={enviando}
          onClick={() => (etapa === 4 ? enviar() : irPara((etapa + 1) as Etapa))}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-white shadow-[0_14px_34px_-16px_rgba(75,0,133,.7)] transition active:scale-[.985] disabled:opacity-70"
          style={{ background: GRAD }}
        >
          {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {etapa === 4 ? (enviando ? "Enviando…" : "Enviar checklist") : "Continuar"}
          {!enviando && <ArrowRight className="h-5 w-5" />}
        </button>
      </div>

      <OperadoresSheet
        aberto={buscaAberta}
        pessoas={pessoas}
        selecionados={estado.operadores}
        onAlternar={(cpf) =>
          mudar(
            "operadores",
            estado.operadores.includes(cpf) ? estado.operadores.filter((c) => c !== cpf) : [...estado.operadores, cpf],
          )
        }
        onFechar={() => setBuscaAberta(false)}
      />
    </div>
  )
}
```

Nota: `EtapaResponsaveis` recebe `payload` (lacres já sem vazios) — por isso o resumo conta só lacres preenchidos. O `bottom-[76px]` do CTA deve ficar logo acima da `BottomNav`; ajuste se a altura real da nav diferir (medir no navegador).

- [ ] **Step 7: Type-check e testes**

Run: `npx tsc --noEmit && npm test`
Expected: sem erros de tipo; testes PASS.

- [ ] **Step 8: Smoke manual (viewport 390×844, logado)**

`npm run dev`, abrir `/formularios/carregamento`:
1. Etapa 1: "Adicionar operador" abre o sheet por cima de tudo (portal), busca por nome filtra, tocar adiciona/remove; chips mostram iniciais + função (sem CPF).
2. Tabs navegam livremente; barra de progresso acompanha.
3. EPIs: tocar marca; tocar de novo desmarca; resumo "X de 7".
4. Lacres: adiciona até 4 (botão some no 4º), remove.
5. Etapa 4: selects só listam Supervisor de Logística / Operador Logístico Líder.
6. Marcar um EPI "Não", deixar ocorrência vazia e Enviar → volta para a etapa com erro e mostra a mensagem.
7. Recarregar a página no meio do preenchimento → aparece "Retomar preenchimento?"; Retomar restaura.
**Não enviar de verdade ainda** (o envio real é validado na Task 8, com autorização do usuário).

- [ ] **Step 9: Commit**

```bash
git add src/app/formularios/carregamento src/components/formularios
git commit -m "feat: wizard do checklist de carregamento (4 etapas, busca de operadores, rascunho no aparelho)"
```

---

### Task 7: Histórico de envios

**Files:**
- Create: `src/app/formularios/historico/page.tsx`

**Interfaces:**
- Consumes: `listarHistorico`, `ItemHistorico` (Task 4); `Pilula` (Task 5).

- [ ] **Step 1: Implementar**

Create `src/app/formularios/historico/page.tsx`:

```tsx
import Link from "next/link"
import { History, Plus, Truck } from "lucide-react"
import { Pilula } from "@/components/formularios/ui"
import { listarHistorico, type ItemHistorico } from "@/lib/formularios/checklist"

export const dynamic = "force-dynamic"

const TZ = "America/Sao_Paulo"
const dia = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" })
const hora = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })

function periodo(i: ItemHistorico) {
  const ini = new Date(i.inicioEm)
  const fim = new Date(i.fimEm)
  const mesmoDia = dia.format(ini) === dia.format(fim)
  return mesmoDia
    ? `${dia.format(ini)} · ${hora.format(ini)}–${hora.format(fim)}`
    : `${dia.format(ini)} ${hora.format(ini)} → ${dia.format(fim)} ${hora.format(fim)}`
}

export default async function HistoricoPage() {
  let itens: ItemHistorico[] = []
  let erro = false
  try {
    itens = await listarHistorico(50)
  } catch {
    erro = true
  }

  return (
    <div className="space-y-4 pt-2">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F0FB] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4B0085]">
          <History className="h-3.5 w-3.5" /> Carregamento
        </span>
        <h1 className="mt-3 font-display text-[26px] font-semibold tracking-tight text-[#201429]">Histórico</h1>
        <p className="mt-1 text-sm text-[#6B5E7B]">Últimos 50 checklists enviados por toda a equipe.</p>
      </div>

      {erro && (
        <p className="rounded-xl bg-[rgba(217,45,45,.08)] p-3 text-sm font-medium text-[#C42B2B]">
          Não foi possível carregar o histórico agora. Tente de novo em instantes.
        </p>
      )}

      {!erro && itens.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#D9CCEA] p-6 text-center">
          <p className="text-sm text-[#6B5E7B]">Nenhum checklist enviado ainda.</p>
          <Link href="/formularios/carregamento" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4B0085]">
            <Plus className="h-4 w-4" /> Preencher o primeiro
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {itens.map((i) => (
          <article key={i.id} className="rounded-2xl border border-[#EDE4F5] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F4F0FB] text-[#4B0085]">
                  <Truck className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="font-display font-semibold text-[#201429]">
                    Veículo {i.veiculoNumero} · {i.veiculoCapacidade}
                  </p>
                  <p className="text-xs text-[#8F82A0]">{periodo(i)}</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#A99BBB]">nº {i.id}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Pilula>{i.qtdOperadores} operadores</Pilula>
              <Pilula>{i.qtdLacres} lacres</Pilula>
              <Pilula className={i.epis.nao > 0 ? "bg-[rgba(217,45,45,.08)] text-[#C42B2B]" : undefined}>
                EPIs: {i.epis.sim} sim · {i.epis.na} N/A · {i.epis.nao} não
              </Pilula>
            </div>
            {i.ocorrencia && <p className="mt-3 rounded-xl bg-[#FBF9FE] p-2.5 text-xs text-[#5B4E6B]">{i.ocorrencia}</p>}
            <p className="mt-3 text-[11px] text-[#8F82A0]">
              Supervisor {i.supervisorNome} · Líder {i.liderNome} · enviado por {i.enviadoPor}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit`
Expected: sem erros. No navegador, `/formularios/historico` mostra o estado vazio ("Nenhum checklist enviado ainda.").

- [ ] **Step 3: Commit**

```bash
git add src/app/formularios/historico
git commit -m "feat: historico de checklists de carregamento"
```

---

### Task 8: Verificação final ponta a ponta

**Files:** nenhum novo (só correções que a verificação revelar).

- [ ] **Step 1: Suíte completa**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: testes PASS, sem erros de tipo, build concluído (avisos de ESLint ausente são esperados).

- [ ] **Step 2: Smoke com Playwright (skill `webapp-testing`)**

Com `npm run dev` e sessão válida, em viewport 390×844: percorrer os 7 itens da Task 6 Step 8 + `/formularios` + `/formularios/historico`, capturando screenshot de cada tela para comparar lado a lado com os artboards `1a`/`1b` do design. Corrigir divergências visuais relevantes.

- [ ] **Step 3: Envio real (PERGUNTAR ao usuário antes)**

O envio grava no db_inhaus de produção e não há exclusão pela tela. Pedir autorização ao usuário para enviar **um** checklist de teste com ocorrência `TESTE — pode desconsiderar`. Se autorizado: enviar, confirmar tela "Checklist enviado", conferir o item no histórico, e conferir no banco (somente leitura) 1 linha no cabeçalho, N operadores e 7 EPIs para esse `id`.

- [ ] **Step 4: Commit de ajustes (se houver)**

```bash
git add -A src
git commit -m "fix: ajustes da verificacao do checklist de carregamento"
```

- [ ] **Step 5: Deploy — lembrar o usuário**

As tabelas já existem no banco (Task 2). Na Vercel, o `DATABASE_URL` de produção precisa apontar para o mesmo db_inhaus (confirmar com o usuário antes de subir). Não fazer push/deploy sem pedido explícito.
