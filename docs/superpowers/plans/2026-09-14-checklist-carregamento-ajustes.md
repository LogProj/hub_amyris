# Checklist de Carregamento — Ajustes (increment 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar os três pedidos do usuário sobre o Checklist de Carregamento já entregue: tirar os cards "Em breve", trocar todo seletor nativo por painel deslizante (calendário e listas) e transformar o histórico em lista filtrável por mês, paginada, com tela de detalhe.

**Architecture:** Reaproveita tudo do increment 1. Extrai um `Sheet` base do `OperadoresSheet` (portal + fixed, regra do CLAUDE.md) e constrói sobre ele os seletores de pessoa e de data/hora. O histórico continua Server Component, agora com `searchParams` (`?mes=&p=`) e uma tela de detalhe por id. Regras de calendário e de mês ficam em módulo puro com vitest.

**Tech Stack:** Next.js 14 (App Router) + TypeScript strict + Tailwind 3.4 + lucide-react + Prisma 5 + vitest.

**Spec:** `docs/superpowers/specs/2026-09-10-checklist-carregamento-design.md` (seção "Ajustes pedidos em 2026-09-14")

## Global Constraints

- **NUNCA** `prisma db push` / `migrate` — `DATABASE_URL` é o **db_inhaus compartilhado**. Nenhuma tabela nova é necessária neste increment; só leitura e consulta.
- Nenhum overlay flutuante com `absolute` dentro de card: **todo painel/overlay via `createPortal(document.body)` + `fixed`** (regra do CLAUDE.md).
- **CPF nunca aparece na tela.** Sob o nome, só a função (`formatarFuncao`).
- Horários são hora de Brasília (UTC−03:00 fixo); exibição com `timeZone: "America/Sao_Paulo"`.
- Textos em português, sem termos técnicos (nada de tabela, coluna, SQL, id de banco — "nº do registro" é aceitável).
- Paginação: **20 por página**, navegação "Anteriores"/"Próximos" + "página X de Y".
- Filtro de mês usa o **mês do carregamento** (`inicio_em`), não o do envio.
- Linguagem visual existente: paleta `#4B0085 / #7C3AED / #A78BFA`, texto `#201429`, apoio `#6D5E78`, borda `#E7DEED`, fundo `#FBF8FF`, `GRAD` de `ui.tsx`, cards `rounded-[24px]`, campos 46px com raio 14px (`classeInput`). Não há artboard de design para as telas novas — seguir esse mesmo vocabulário.
- Verificação: `npm test` + `npx tsc --noEmit` + `npm run build`. O projeto não tem config ESLint (não criar uma).
- Commits em português, `feat:`/`fix:`/`refactor:`, terminando com as duas linhas de atribuição informadas no dispatch.

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/app/formularios/page.tsx` | 1A sem a seção "Em breve" |
| `src/components/formularios/Sheet.tsx` | painel deslizante base (portal + fixed + backdrop + cabeçalho) |
| `src/components/formularios/CampoSeletor.tsx` | botão com cara de campo que abre um painel |
| `src/components/formularios/PessoaSheet.tsx` | seleção única de pessoa, com busca |
| `src/components/formularios/DataHoraSheet.tsx` | calendário do mês + hora |
| `src/components/formularios/OperadoresSheet.tsx` | passa a usar o `Sheet` base |
| `src/components/formularios/EtapaEquipe.tsx` | período por painel de data/hora |
| `src/components/formularios/EtapaResponsaveis.tsx` | supervisor/líder por painel de pessoa |
| `src/lib/formularios/calendario.ts` (+ `.test.ts`) | funções puras de data/mês/grade |
| `src/lib/formularios/checklist.ts` | meses disponíveis, paginação, detalhe |
| `src/lib/formularios/checklist.test.ts` | testes das funções puras novas |
| `src/app/formularios/historico/page.tsx` | filtro de mês + paginação |
| `src/components/formularios/FiltroMes.tsx` | seletor de mês (usa `Sheet`) |
| `src/app/formularios/historico/[id]/page.tsx` | tela de detalhe |

---

### Task 1: Tirar os "Em breve" da tela de formulários

**Files:**
- Modify: `src/app/formularios/page.tsx`

**Interfaces:**
- Consumes: nada novo. Produces: nada novo.

- [ ] **Step 1: Remover a seção**

Em `src/app/formularios/page.tsx`: apagar a constante `EM_BREVE`, o bloco JSX inteiro que renderiza `"Em breve"` (o `<div className="space-y-2">` com o `<p>Em breve</p>` e o `.map`), e os imports que ficarem sem uso (`ClipboardCheck`, `HardHat`, `ShieldAlert`, `Lock` — conferir um a um antes de remover). Manter o cabeçalho, o card "Disponível agora" com Carregamento e o link "Histórico de envios".

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: sem erros de tipo (inclusive nenhum import não usado quebrando o build), 22 testes passando, build OK.

- [ ] **Step 3: Commit**

```bash
git add src/app/formularios/page.tsx
git commit -m "feat: remove os formularios 'em breve' da lista"
```

---

### Task 2: Painel base + seletor de pessoa (supervisor e líder)

**Files:**
- Create: `src/components/formularios/Sheet.tsx`, `src/components/formularios/CampoSeletor.tsx`, `src/components/formularios/PessoaSheet.tsx`
- Modify: `src/components/formularios/OperadoresSheet.tsx`, `src/components/formularios/EtapaResponsaveis.tsx`

**Interfaces:**
- Consumes: `PessoaSra`, `formatarFuncao`, `iniciais`, `podeSerSupervisor`, `podeSerLider` (`@/lib/formularios/regras`); `GRAD`, `Campo`, `Cartao`, `MensagemErro`, `Pilula` (`./ui`).
- Produces:
  - `Sheet({ aberto, titulo, subtitulo, onFechar, children }): JSX.Element | null`
  - `CampoSeletor({ valor, placeholder, icone, onAbrir, invalido }): JSX.Element` — botão com a aparência de `classeInput`
  - `PessoaSheet({ aberto, titulo, subtitulo, pessoas, selecionado, onSelecionar, onFechar })` — seleção única; fecha ao escolher

- [ ] **Step 1: O painel base**

Create `src/components/formularios/Sheet.tsx` — extraído do `OperadoresSheet` atual, mesmos valores visuais:

```tsx
"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

/**
 * Painel deslizante de baixo para cima. SEMPRE em portal para o body + fixed:
 * dentro dos cards (glass/backdrop-blur) um overlay absolute fica preso atrás
 * dos cards seguintes — ver CLAUDE.md.
 */
export function Sheet({
  aberto,
  titulo,
  subtitulo,
  onFechar,
  children,
}: {
  aberto: boolean
  titulo: string
  subtitulo?: string
  onFechar: () => void
  children: React.ReactNode
}) {
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])

  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar()
    }
    document.addEventListener("keydown", aoTeclar)
    return () => document.removeEventListener("keydown", aoTeclar)
  }, [aberto, onFechar])

  if (!montado || !aberto) return null
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="absolute inset-0 bg-[rgba(26,11,46,.45)] backdrop-blur-[2px]" onClick={onFechar} />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[78dvh] w-full max-w-[430px] flex-col rounded-t-[30px] bg-white px-4 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] shadow-[0_-20px_60px_-20px_rgba(26,11,46,.5)]">
        <span className="mx-auto mb-3 h-1 w-[38px] shrink-0 rounded-full bg-[#E7DEED]" />
        <div className="mb-3 flex shrink-0 items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold text-[#201429]">{titulo}</p>
            {subtitulo && <p className="text-[11px] text-[#6D5E78]">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[13px] bg-[#F4F0FB] text-[#4B0085]"
          >
            <X className="h-[17px] w-[17px]" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
```

- [ ] **Step 2: `OperadoresSheet` passa a usar o base**

Reescrever `src/components/formularios/OperadoresSheet.tsx` mantendo props e visual, só trocando a casca pelo `Sheet`:

```tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Search } from "lucide-react"
import { formatarFuncao, iniciais, type PessoaSra } from "@/lib/formularios/regras"
import { Sheet } from "./Sheet"
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
  useEffect(() => {
    if (aberto) setBusca("")
  }, [aberto])

  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? pessoas.filter((p) => p.nome.toLowerCase().includes(q)) : pessoas
  }, [busca, pessoas])

  return (
    <Sheet aberto={aberto} titulo="Operadores da SRA" subtitulo="Todos os ativos do CR · toque para adicionar" onFechar={onFechar}>
      <div className="relative mb-3 shrink-0">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#6D5E78]" />
        <input
          autoFocus
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome…"
          className="h-12 w-full rounded-2xl border border-[#E7DEED] bg-[#FBF8FF] pl-10 pr-3 text-[13px] outline-none focus:border-[rgba(75,0,133,.5)] focus:shadow-[0_0_0_3px_rgba(75,0,133,.16)]"
        />
      </div>
      <div className="-mx-1 flex-1 space-y-[7px] overflow-y-auto px-1 pb-1">
        {resultados.length === 0 && <p className="py-6 text-center text-sm text-[#8F82A0]">Ninguém encontrado.</p>}
        {resultados.map((p) => {
          const on = selecionados.includes(p.cpf)
          return (
            <button
              key={p.cpf}
              type="button"
              onClick={() => onAlternar(p.cpf)}
              className="flex w-full items-center gap-[11px] rounded-2xl border p-2.5 text-left transition"
              style={{ background: on ? "#F7F3FD" : "#fff", borderColor: on ? "rgba(124,58,237,.35)" : "#E7DEED" }}
            >
              <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[11px] bg-[#F4F0FB] text-xs font-bold text-[#4B0085]">
                {iniciais(p.nome)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-semibold text-[#201429]">{p.nome}</span>
                <span className="truncate text-[10px] text-[#6D5E78]">{formatarFuncao(p.funcao)}</span>
              </span>
              <span
                className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px]"
                style={{ background: on ? GRAD : "#F1EBF8", color: on ? "#fff" : "#CFC4DA" }}
              >
                <Check className="h-[15px] w-[15px]" />
              </span>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
```

- [ ] **Step 3: Campo que abre painel**

Create `src/components/formularios/CampoSeletor.tsx`:

```tsx
"use client"

import type { LucideIcon } from "lucide-react"
import { ChevronDown } from "lucide-react"

/** Botão com a mesma aparência de um campo (classeInput), que abre um painel. */
export function CampoSeletor({
  valor,
  placeholder,
  icone: Icone,
  onAbrir,
  invalido = false,
}: {
  valor: string | null
  placeholder: string
  icone?: LucideIcon
  onAbrir: () => void
  invalido?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      className="flex h-[46px] w-full items-center gap-2.5 rounded-[14px] border bg-white px-3 text-left text-[13px] transition"
      style={{ borderColor: invalido ? "rgba(196,43,43,.5)" : "#E7DEED" }}
    >
      {Icone && <Icone className="h-[17px] w-[17px] shrink-0 text-[#7C3AED]" />}
      <span className={`min-w-0 flex-1 truncate ${valor ? "font-semibold text-[#201429]" : "text-[#A79BB0]"}`}>
        {valor || placeholder}
      </span>
      <ChevronDown className="h-[17px] w-[17px] shrink-0 text-[#6D5E78]" />
    </button>
  )
}
```

- [ ] **Step 4: Painel de pessoa (seleção única)**

Create `src/components/formularios/PessoaSheet.tsx`:

```tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Search } from "lucide-react"
import { formatarFuncao, iniciais, type PessoaSra } from "@/lib/formularios/regras"
import { Sheet } from "./Sheet"
import { GRAD } from "./ui"

export function PessoaSheet({
  aberto,
  titulo,
  subtitulo,
  pessoas,
  selecionado,
  onSelecionar,
  onFechar,
}: {
  aberto: boolean
  titulo: string
  subtitulo?: string
  pessoas: PessoaSra[]
  selecionado: string
  onSelecionar: (cpf: string) => void
  onFechar: () => void
}) {
  const [busca, setBusca] = useState("")
  useEffect(() => {
    if (aberto) setBusca("")
  }, [aberto])

  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? pessoas.filter((p) => p.nome.toLowerCase().includes(q)) : pessoas
  }, [busca, pessoas])

  return (
    <Sheet aberto={aberto} titulo={titulo} subtitulo={subtitulo} onFechar={onFechar}>
      {pessoas.length > 6 && (
        <div className="relative mb-3 shrink-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#6D5E78]" />
          <input
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome…"
            className="h-12 w-full rounded-2xl border border-[#E7DEED] bg-[#FBF8FF] pl-10 pr-3 text-[13px] outline-none focus:border-[rgba(75,0,133,.5)] focus:shadow-[0_0_0_3px_rgba(75,0,133,.16)]"
          />
        </div>
      )}
      <div className="-mx-1 flex-1 space-y-[7px] overflow-y-auto px-1 pb-1">
        {resultados.length === 0 && <p className="py-6 text-center text-sm text-[#8F82A0]">Ninguém encontrado.</p>}
        {resultados.map((p) => {
          const on = selecionado === p.cpf
          return (
            <button
              key={p.cpf}
              type="button"
              onClick={() => {
                onSelecionar(p.cpf)
                onFechar()
              }}
              className="flex w-full items-center gap-[11px] rounded-2xl border p-2.5 text-left transition"
              style={{ background: on ? "#F7F3FD" : "#fff", borderColor: on ? "rgba(124,58,237,.35)" : "#E7DEED" }}
            >
              <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[11px] bg-[#F4F0FB] text-xs font-bold text-[#4B0085]">
                {iniciais(p.nome)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-semibold text-[#201429]">{p.nome}</span>
                <span className="truncate text-[10px] text-[#6D5E78]">{formatarFuncao(p.funcao)}</span>
              </span>
              {on && (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-white" style={{ background: GRAD }}>
                  <Check className="h-[15px] w-[15px]" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
```

- [ ] **Step 5: Etapa 4 usa os painéis**

Em `src/components/formularios/EtapaResponsaveis.tsx`: trocar os dois `<select>` por `CampoSeletor` + `PessoaSheet`. Vira client component com estado local de qual painel está aberto:

```tsx
"use client"

import { useState } from "react"
import { MessageSquareWarning, UserCheck } from "lucide-react"
import { EPIS, formatarFuncao, podeSerLider, podeSerSupervisor, resumoEpis, type ChecklistPayload, type PessoaSra } from "@/lib/formularios/regras"
import type { Erros } from "./ChecklistWizard"
import { CampoSeletor } from "./CampoSeletor"
import { PessoaSheet } from "./PessoaSheet"
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
  const [painel, setPainel] = useState<"supervisor" | "lider" | null>(null)
  const supervisores = pessoas.filter(podeSerSupervisor)
  const lideres = pessoas.filter(podeSerLider)
  const temNao = EPIS.some((e) => estado.epis[e.codigo] === "nao")
  const lacresPreenchidos = estado.lacres.filter((l) => l.trim()).length

  const nomeDe = (cpf: string) => {
    const p = pessoas.find((x) => x.cpf === cpf)
    return p ? `${p.nome} · ${formatarFuncao(p.funcao)}` : null
  }

  return (
    <div className="space-y-3.5">
      <Cartao icone={UserCheck} titulo="Responsáveis" subtitulo="Cargos validados na SRA">
        <div className="space-y-3">
          <Campo rotulo="Supervisor responsável" erro={erros.supervisorCpf}>
            <CampoSeletor
              valor={nomeDe(estado.supervisorCpf)}
              placeholder={supervisores.length ? "Escolher supervisor" : "Nenhum Supervisor de Logística ativo hoje"}
              onAbrir={() => supervisores.length > 0 && setPainel("supervisor")}
              invalido={!!erros.supervisorCpf}
            />
          </Campo>
          <Campo rotulo="Líder responsável" erro={erros.liderCpf}>
            <CampoSeletor
              valor={nomeDe(estado.liderCpf)}
              placeholder={lideres.length ? "Escolher líder" : "Nenhum Operador Logístico Líder ativo hoje"}
              onAbrir={() => lideres.length > 0 && setPainel("lider")}
              invalido={!!erros.liderCpf}
            />
          </Campo>
        </div>
      </Cartao>

      {/* … cartão de Ocorrência e bloco Resumo permanecem exatamente como estão hoje … */}

      <PessoaSheet
        aberto={painel === "supervisor"}
        titulo="Supervisor responsável"
        subtitulo="Somente Supervisor de Logística"
        pessoas={supervisores}
        selecionado={estado.supervisorCpf}
        onSelecionar={(cpf) => onMudar("supervisorCpf", cpf)}
        onFechar={() => setPainel(null)}
      />
      <PessoaSheet
        aberto={painel === "lider"}
        titulo="Líder responsável"
        subtitulo="Somente Operador Logístico Líder"
        pessoas={lideres}
        selecionado={estado.liderCpf}
        onSelecionar={(cpf) => onMudar("liderCpf", cpf)}
        onFechar={() => setPainel(null)}
      />
    </div>
  )
}
```

Manter o cartão "Ocorrência" e o bloco "Resumo" exatamente como estão no arquivo atual (copiar do arquivo, não reescrever de memória).

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: limpo, 22 testes passando, build OK. Conferir também que `OperadoresSheet` continua com as mesmas props e comportamento (nenhum outro arquivo precisa mudar).

- [ ] **Step 7: Commit**

```bash
git add src/components/formularios
git commit -m "feat: seletores de supervisor e lider em painel deslizante (Sheet base reutilizavel)"
```

---

### Task 3: Calendário com hora para o período

**Files:**
- Create: `src/lib/formularios/calendario.ts`, `src/lib/formularios/calendario.test.ts`, `src/components/formularios/DataHoraSheet.tsx`
- Modify: `src/components/formularios/EtapaEquipe.tsx`

**Interfaces:**
- Consumes: `Sheet`, `CampoSeletor` (Task 2).
- Produces, de `@/lib/formularios/calendario`:
  - `separar(valor: string): { data: string; hora: string }` — `"2026-09-11T07:30"` → `{ data: "2026-09-11", hora: "07:30" }`; valor inválido → `{ data: "", hora: "" }`
  - `juntar(data: string, hora: string): string` — `""` se faltar algum
  - `formatarDataHora(valor: string): string` — `"11/09/2026 · 07:30"`; inválido → `""`
  - `rotuloMesAno(ano: number, mes: number): string` — `"Setembro de 2026"` (mes 1-12)
  - `gradeDoMes(ano: number, mes: number): (string | null)[]` — 42 posições, semana começando no domingo; cada posição é `"YYYY-MM-DD"` ou `null`
  - `hojeBrasilia(): string` — `"YYYY-MM-DD"` de hoje em São Paulo
  - `HORAS: string[]` — `"00:00"`…`"23:30"` de 30 em 30 minutos
- Produces, de `./DataHoraSheet`: `DataHoraSheet({ aberto, titulo, valor, onConfirmar, onFechar })`

- [ ] **Step 1: Testes do módulo puro (falhando)**

Create `src/lib/formularios/calendario.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { HORAS, formatarDataHora, gradeDoMes, juntar, rotuloMesAno, separar } from "./calendario"

describe("separar / juntar", () => {
  it("separa data e hora", () => {
    expect(separar("2026-09-11T07:30")).toEqual({ data: "2026-09-11", hora: "07:30" })
  })
  it("devolve vazio para valor inválido", () => {
    expect(separar("")).toEqual({ data: "", hora: "" })
    expect(separar("11/09/2026")).toEqual({ data: "", hora: "" })
  })
  it("junta data e hora", () => {
    expect(juntar("2026-09-11", "07:30")).toBe("2026-09-11T07:30")
  })
  it("não junta se faltar parte", () => {
    expect(juntar("2026-09-11", "")).toBe("")
    expect(juntar("", "07:30")).toBe("")
  })
})

describe("formatarDataHora", () => {
  it("formata para leitura", () => {
    expect(formatarDataHora("2026-09-11T07:30")).toBe("11/09/2026 · 07:30")
  })
  it("devolve vazio para valor inválido", () => {
    expect(formatarDataHora("")).toBe("")
  })
})

describe("rotuloMesAno", () => {
  it("nomeia o mês em português", () => {
    expect(rotuloMesAno(2026, 9)).toBe("Setembro de 2026")
    expect(rotuloMesAno(2026, 1)).toBe("Janeiro de 2026")
  })
})

describe("gradeDoMes", () => {
  const grade = gradeDoMes(2026, 9) // setembro/2026 começa numa terça-feira

  it("tem 42 posições", () => {
    expect(grade).toHaveLength(42)
  })
  it("deixa vazias as posições antes do dia 1 (semana começa no domingo)", () => {
    expect(grade[0]).toBeNull()
    expect(grade[1]).toBeNull()
    expect(grade[2]).toBe("2026-09-01")
  })
  it("cobre todos os dias do mês e nada além", () => {
    const dias = grade.filter((d): d is string => d !== null)
    expect(dias).toHaveLength(30)
    expect(dias[29]).toBe("2026-09-30")
  })
  it("lida com fevereiro bissexto", () => {
    const fev = gradeDoMes(2028, 2).filter((d): d is string => d !== null)
    expect(fev).toHaveLength(29)
  })
})

describe("HORAS", () => {
  it("vai de 00:00 a 23:30 de 30 em 30 minutos", () => {
    expect(HORAS).toHaveLength(48)
    expect(HORAS[0]).toBe("00:00")
    expect(HORAS[1]).toBe("00:30")
    expect(HORAS[47]).toBe("23:30")
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- calendario`
Expected: FAIL — `Failed to resolve import "./calendario"`.

- [ ] **Step 3: Implementar o módulo**

Create `src/lib/formularios/calendario.ts`:

```ts
// Funções puras de data/hora do formulário. O valor canônico é sempre
// "YYYY-MM-DDTHH:mm" em hora de Brasília (mesmo formato que o input nativo usava).

const VALOR = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/

export function separar(valor: string): { data: string; hora: string } {
  const m = VALOR.exec(valor ?? "")
  return m ? { data: m[1], hora: m[2] } : { data: "", hora: "" }
}

export function juntar(data: string, hora: string): string {
  return data && hora ? `${data}T${hora}` : ""
}

export function formatarDataHora(valor: string): string {
  const { data, hora } = separar(valor)
  if (!data) return ""
  const [ano, mes, dia] = data.split("-")
  return `${dia}/${mes}/${ano} · ${hora}`
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export function rotuloMesAno(ano: number, mes: number): string {
  return `${MESES[mes - 1]} de ${ano}`
}

const dois = (n: number) => String(n).padStart(2, "0")

/** 42 posições (6 semanas de domingo a sábado); fora do mês é null. */
export function gradeDoMes(ano: number, mes: number): (string | null)[] {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1))
  const deslocamento = primeiro.getUTCDay() // 0 = domingo
  const totalDias = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  return Array.from({ length: 42 }, (_, i) => {
    const dia = i - deslocamento + 1
    return dia >= 1 && dia <= totalDias ? `${ano}-${dois(mes)}-${dois(dia)}` : null
  })
}

/** Hoje em São Paulo, como "YYYY-MM-DD" (o servidor pode estar em outro fuso). */
export function hojeBrasilia(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export const HORAS: string[] = Array.from({ length: 48 }, (_, i) => `${dois(Math.floor(i / 2))}:${i % 2 ? "30" : "00"}`)
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS (todos os arquivos de teste).

- [ ] **Step 5: O painel de data e hora**

Create `src/components/formularios/DataHoraSheet.tsx` — calendário do mês + trilha de horários; confirma no botão:

```tsx
"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { HORAS, gradeDoMes, hojeBrasilia, juntar, rotuloMesAno, separar } from "@/lib/formularios/calendario"
import { Sheet } from "./Sheet"
import { GRAD } from "./ui"

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"]

export function DataHoraSheet({
  aberto,
  titulo,
  valor,
  onConfirmar,
  onFechar,
}: {
  aberto: boolean
  titulo: string
  valor: string
  onConfirmar: (valor: string) => void
  onFechar: () => void
}) {
  const inicial = separar(valor)
  const base = inicial.data || hojeBrasilia()
  const [ano, setAno] = useState(Number(base.slice(0, 4)))
  const [mes, setMes] = useState(Number(base.slice(5, 7)))
  const [data, setData] = useState(inicial.data)
  const [hora, setHora] = useState(inicial.hora)

  // Reabrir sempre parte do valor atual do campo.
  useEffect(() => {
    if (!aberto) return
    const atual = separar(valor)
    const ref = atual.data || hojeBrasilia()
    setAno(Number(ref.slice(0, 4)))
    setMes(Number(ref.slice(5, 7)))
    setData(atual.data)
    setHora(atual.hora)
  }, [aberto, valor])

  const mudarMes = (passo: number) => {
    const d = new Date(Date.UTC(ano, mes - 1 + passo, 1))
    setAno(d.getUTCFullYear())
    setMes(d.getUTCMonth() + 1)
  }

  const hoje = hojeBrasilia()
  const pronto = !!data && !!hora

  return (
    <Sheet aberto={aberto} titulo={titulo} subtitulo="Escolha o dia e o horário" onFechar={onFechar}>
      <div className="flex-1 overflow-y-auto pb-1">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={() => mudarMes(-1)} aria-label="Mês anterior" className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#F4F0FB] text-[#4B0085]">
            <ChevronLeft className="h-[17px] w-[17px]" />
          </button>
          <p className="font-display text-sm font-semibold text-[#201429]">{rotuloMesAno(ano, mes)}</p>
          <button type="button" onClick={() => mudarMes(1)} aria-label="Próximo mês" className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#F4F0FB] text-[#4B0085]">
            <ChevronRight className="h-[17px] w-[17px]" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {DIAS_SEMANA.map((d, i) => (
            <span key={i} className="py-1 text-[10px] font-semibold uppercase text-[#A79BB0]">
              {d}
            </span>
          ))}
          {gradeDoMes(ano, mes).map((dia, i) => {
            if (!dia) return <span key={i} />
            const selecionado = dia === data
            const ehHoje = dia === hoje
            return (
              <button
                key={i}
                type="button"
                onClick={() => setData(dia)}
                aria-pressed={selecionado}
                className="grid h-10 place-items-center rounded-[12px] text-[13px] font-semibold transition"
                style={{
                  background: selecionado ? GRAD : ehHoje ? "#F4F0FB" : "transparent",
                  color: selecionado ? "#fff" : "#201429",
                }}
              >
                {Number(dia.slice(8))}
              </button>
            )
          })}
        </div>

        <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A79BB0]">Horário</p>
        <div className="grid grid-cols-4 gap-1.5">
          {HORAS.map((h) => {
            const on = h === hora
            return (
              <button
                key={h}
                type="button"
                onClick={() => setHora(h)}
                aria-pressed={on}
                className="h-9 rounded-[12px] border text-[12px] font-semibold transition"
                style={{
                  background: on ? GRAD : "#fff",
                  color: on ? "#fff" : "#201429",
                  borderColor: on ? "transparent" : "#E7DEED",
                }}
              >
                {h}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={!pronto}
        onClick={() => {
          onConfirmar(juntar(data, hora))
          onFechar()
        }}
        className="mt-3 h-12 shrink-0 rounded-2xl text-[15px] font-semibold text-white transition disabled:opacity-40"
        style={{ background: GRAD }}
      >
        Confirmar
      </button>
    </Sheet>
  )
}
```

- [ ] **Step 6: Etapa 1 usa o painel**

Em `src/components/formularios/EtapaEquipe.tsx`: trocar os dois `<input type="datetime-local">` por `CampoSeletor` + `DataHoraSheet`, mantendo a lista de operadores e o resto intactos. Acrescentar `import { useState } from "react"`, `import { formatarDataHora } from "@/lib/formularios/calendario"`, `CampoSeletor`, `DataHoraSheet`, e o ícone `CalendarClock` já importado:

```tsx
  const [painel, setPainel] = useState<"inicio" | "fim" | null>(null)
  // …
      <Cartao icone={CalendarClock} titulo="Período da atividade" subtitulo="Data e hora de início e fim">
        <div className="grid gap-3">
          <Campo rotulo="Data/hora início" erro={erros.inicioEm}>
            <CampoSeletor
              valor={formatarDataHora(inicioEm) || null}
              placeholder="Escolher data e hora"
              icone={CalendarClock}
              onAbrir={() => setPainel("inicio")}
              invalido={!!erros.inicioEm}
            />
          </Campo>
          <Campo rotulo="Data/hora fim" erro={erros.fimEm}>
            <CampoSeletor
              valor={formatarDataHora(fimEm) || null}
              placeholder="Escolher data e hora"
              icone={CalendarClock}
              onAbrir={() => setPainel("fim")}
              invalido={!!erros.fimEm}
            />
          </Campo>
        </div>
      </Cartao>

      <DataHoraSheet
        aberto={painel === "inicio"}
        titulo="Início do carregamento"
        valor={inicioEm}
        onConfirmar={(v) => onMudar("inicioEm", v)}
        onFechar={() => setPainel(null)}
      />
      <DataHoraSheet
        aberto={painel === "fim"}
        titulo="Fim do carregamento"
        valor={fimEm}
        onConfirmar={(v) => onMudar("fimEm", v)}
        onFechar={() => setPainel(null)}
      />
```

`classeInput` deixa de ser usado neste arquivo — remover do import se ficar sem uso.

- [ ] **Step 7: Verificar**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: limpo; testes de `calendario` passando junto com os demais. O valor gravado continua `"YYYY-MM-DDTHH:mm"`, então `validarChecklist` e `paraDataBrasilia` seguem funcionando sem mudança.

- [ ] **Step 8: Commit**

```bash
git add src/lib/formularios/calendario.ts src/lib/formularios/calendario.test.ts src/components/formularios/DataHoraSheet.tsx src/components/formularios/EtapaEquipe.tsx
git commit -m "feat: periodo do checklist por calendario em painel deslizante"
```

---

### Task 4: Dados do histórico — meses, paginação e detalhe

**Files:**
- Modify: `src/lib/formularios/checklist.ts`, `src/lib/formularios/checklist.test.ts`

**Interfaces:**
- Produces:
  - `listarMesesHistorico(): Promise<string[]>` — `["2026-09", "2026-08", …]`, do mais recente para o mais antigo, pelo **mês do carregamento** em São Paulo
  - `type PaginaHistorico = { itens: ItemHistorico[]; total: number; pagina: number; paginas: number }`
  - `listarHistorico(opcoes?: { mes?: string; pagina?: number; porPagina?: number }): Promise<PaginaHistorico>` — **assinatura nova** (a antiga recebia um número; o único chamador é a página do histórico, atualizada na Task 5)
  - `intervaloDoMes(mes: string): { inicio: Date; fim: Date } | null` — função pura, testada
  - `type DetalheChecklist`, `obterChecklist(id: number): Promise<DetalheChecklist | null>`
  - `POR_PAGINA = 20`

- [ ] **Step 1: Teste da função pura (falhando)**

Append em `src/lib/formularios/checklist.test.ts`:

```ts
import { intervaloDoMes } from "./checklist"

describe("intervaloDoMes", () => {
  it("cobre o mês inteiro em hora de Brasília", () => {
    const r = intervaloDoMes("2026-09")
    expect(r?.inicio.toISOString()).toBe("2026-09-01T03:00:00.000Z")
    expect(r?.fim.toISOString()).toBe("2026-10-01T03:00:00.000Z")
  })
  it("vira o ano em dezembro", () => {
    const r = intervaloDoMes("2026-12")
    expect(r?.fim.toISOString()).toBe("2027-01-01T03:00:00.000Z")
  })
  it("recusa mês inválido", () => {
    expect(intervaloDoMes("")).toBeNull()
    expect(intervaloDoMes("2026-13")).toBeNull()
    expect(intervaloDoMes("setembro")).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- checklist`
Expected: FAIL — `intervaloDoMes is not a function` (ou erro de import).

- [ ] **Step 3: Implementar**

Em `src/lib/formularios/checklist.ts`, acrescentar (mantendo tudo que já existe; só `listarHistorico` muda de assinatura):

```ts
export const POR_PAGINA = 20

const MES = /^(\d{4})-(\d{2})$/

/** Início (inclusive) e fim (exclusivo) do mês, em hora de Brasília. */
export function intervaloDoMes(mes: string): { inicio: Date; fim: Date } | null {
  const m = MES.exec(mes ?? "")
  if (!m) return null
  const ano = Number(m[1])
  const numero = Number(m[2])
  if (numero < 1 || numero > 12) return null
  const proximoAno = numero === 12 ? ano + 1 : ano
  const proximoMes = numero === 12 ? 1 : numero + 1
  const dois = (n: number) => String(n).padStart(2, "0")
  return {
    inicio: new Date(`${ano}-${dois(numero)}-01T00:00:00-03:00`),
    fim: new Date(`${proximoAno}-${dois(proximoMes)}-01T00:00:00-03:00`),
  }
}

/** Meses que têm carregamento registrado, pelo mês de INÍCIO em São Paulo. */
export async function listarMesesHistorico(): Promise<string[]> {
  const linhas = await prisma.$queryRaw<{ mes: string }[]>`
    select distinct to_char(inicio_em at time zone 'America/Sao_Paulo', 'YYYY-MM') as mes
      from public.ft_amyris_checklist_carregamento
     order by mes desc`
  return linhas.map((l) => l.mes)
}

export type PaginaHistorico = { itens: ItemHistorico[]; total: number; pagina: number; paginas: number }
```

Substituir a `listarHistorico` atual por:

```ts
// Envios de TODOS os usuários (conferência entre turnos), mais recentes primeiro,
// opcionalmente de um mês de carregamento só, em páginas de POR_PAGINA.
export async function listarHistorico(
  opcoes: { mes?: string; pagina?: number; porPagina?: number } = {},
): Promise<PaginaHistorico> {
  const porPagina = opcoes.porPagina ?? POR_PAGINA
  const intervalo = opcoes.mes ? intervaloDoMes(opcoes.mes) : null
  const where = intervalo ? { inicioEm: { gte: intervalo.inicio, lt: intervalo.fim } } : {}

  const total = await prisma.ftAmyrisChecklistCarregamento.count({ where })
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  const pagina = Math.min(Math.max(1, opcoes.pagina ?? 1), paginas)

  const linhas = await prisma.ftAmyrisChecklistCarregamento.findMany({
    where,
    orderBy: { inicioEm: "desc" },
    skip: (pagina - 1) * porPagina,
    take: porPagina,
    include: { operadores: { select: { id: true } }, epis: { select: { status: true } } },
  })

  return { itens: linhas.map(paraItem), total, pagina, paginas }
}
```

…extraindo o `.map(...)` de hoje para uma função `paraItem(l)` (mesmo corpo do map atual, tipado com o retorno do `findMany`), reusada pelas duas consultas.

E o detalhe:

```ts
export type DetalheChecklist = {
  id: number
  enviadoEm: string
  inicioEm: string
  fimEm: string
  veiculoNumero: string
  veiculoCapacidade: string
  lacres: string[]
  supervisorNome: string
  supervisorFuncao: string
  liderNome: string
  liderFuncao: string
  ocorrencia: string | null
  enviadoPor: string
  operadores: { nome: string; funcao: string | null }[]
  epis: { codigo: string; nome: string; status: EpiStatus }[]
}

/** Um checklist inteiro para a tela de detalhe. CPF não sai daqui. */
export async function obterChecklist(id: number): Promise<DetalheChecklist | null> {
  const l = await prisma.ftAmyrisChecklistCarregamento.findUnique({
    where: { id },
    include: {
      operadores: { select: { nome: true, funcao: true }, orderBy: { nome: "asc" } },
      epis: { select: { status: true, epi: { select: { codigo: true, nome: true, ordem: true } } }, orderBy: { epi: { ordem: "asc" } } },
    },
  })
  if (!l) return null
  return {
    id: l.id,
    enviadoEm: l.enviadoEm.toISOString(),
    inicioEm: l.inicioEm.toISOString(),
    fimEm: l.fimEm.toISOString(),
    veiculoNumero: l.veiculoNumero,
    veiculoCapacidade: l.veiculoCapacidade,
    lacres: l.lacres,
    supervisorNome: l.supervisorNome,
    supervisorFuncao: l.supervisorFuncao,
    liderNome: l.liderNome,
    liderFuncao: l.liderFuncao,
    ocorrencia: l.ocorrencia,
    enviadoPor: l.criadoPorNome ?? l.criadoPorEmail,
    operadores: l.operadores.map((o) => ({ nome: o.nome, funcao: o.funcao })),
    epis: l.epis.map((e) => ({ codigo: e.epi.codigo, nome: e.epi.nome, status: e.status as EpiStatus })),
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS. `npx tsc --noEmit` vai acusar a página do histórico (chamador antigo de `listarHistorico`) — isso é esperado e a Task 5 corrige; não alterar a página aqui.

- [ ] **Step 5: Commit**

```bash
git add src/lib/formularios/checklist.ts src/lib/formularios/checklist.test.ts
git commit -m "feat: historico com filtro por mes, paginacao e leitura de detalhe"
```

---

### Task 5: Telas do histórico — filtro, paginação e detalhe

**Files:**
- Create: `src/components/formularios/FiltroMes.tsx`, `src/app/formularios/historico/[id]/page.tsx`
- Modify: `src/app/formularios/historico/page.tsx`

**Interfaces:**
- Consumes: `listarHistorico`, `listarMesesHistorico`, `obterChecklist`, `POR_PAGINA`, `ItemHistorico`, `DetalheChecklist` (Task 4); `Sheet` (Task 2); `Pilula`, `Cartao` (`./ui`).

- [ ] **Step 1: Seletor de mês**

Create `src/components/formularios/FiltroMes.tsx` (client; navega mudando a URL):

```tsx
"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { CalendarRange, Check } from "lucide-react"
import { rotuloMesAno } from "@/lib/formularios/calendario"
import { Sheet } from "./Sheet"
import { GRAD } from "./ui"

export function FiltroMes({ meses, atual }: { meses: string[]; atual: string | null }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)

  const rotulo = (mes: string) => rotuloMesAno(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)))
  const escolher = (mes: string | null) => {
    setAberto(false)
    router.push(mes ? `/formularios/historico?mes=${mes}` : "/formularios/historico")
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex h-[42px] w-full items-center gap-2.5 rounded-[14px] border border-[#E7DEED] bg-white px-3 text-left text-[13px] font-semibold text-[#201429]"
      >
        <CalendarRange className="h-[17px] w-[17px] text-[#7C3AED]" />
        <span className="flex-1 truncate">{atual ? rotulo(atual) : "Todos os meses"}</span>
        <span className="text-[11px] font-semibold text-[#7C3AED]">Trocar</span>
      </button>

      <Sheet aberto={aberto} titulo="Filtrar por mês" subtitulo="Mês do carregamento" onFechar={() => setAberto(false)}>
        <div className="-mx-1 flex-1 space-y-[7px] overflow-y-auto px-1 pb-1">
          <OpcaoMes rotulo="Todos os meses" ativo={!atual} onClick={() => escolher(null)} />
          {meses.map((m) => (
            <OpcaoMes key={m} rotulo={rotulo(m)} ativo={atual === m} onClick={() => escolher(m)} />
          ))}
          {meses.length === 0 && <p className="py-6 text-center text-sm text-[#8F82A0]">Nenhum carregamento registrado ainda.</p>}
        </div>
      </Sheet>
    </>
  )
}

function OpcaoMes({ rotulo, ativo, onClick }: { rotulo: string; ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-[13px] font-semibold transition"
      style={{ background: ativo ? "#F7F3FD" : "#fff", borderColor: ativo ? "rgba(124,58,237,.35)" : "#E7DEED", color: "#201429" }}
    >
      <span className="flex-1 truncate">{rotulo}</span>
      {ativo && (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-white" style={{ background: GRAD }}>
          <Check className="h-[15px] w-[15px]" />
        </span>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Lista com filtro e paginação**

Em `src/app/formularios/historico/page.tsx`: manter o cabeçalho, o formato do card e `periodo()`; passar a ler `searchParams`, chamar a API nova, envolver cada card num `Link` para o detalhe e acrescentar o rodapé de paginação.

```tsx
import Link from "next/link"
import { ChevronRight, History, Plus, Truck } from "lucide-react"
import { FiltroMes } from "@/components/formularios/FiltroMes"
import { Pilula } from "@/components/formularios/ui"
import { listarHistorico, listarMesesHistorico, type ItemHistorico, type PaginaHistorico } from "@/lib/formularios/checklist"

export const dynamic = "force-dynamic"

// … TZ, dia, hora e periodo() permanecem como estão …

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: { mes?: string; p?: string }
}) {
  const mes = typeof searchParams.mes === "string" && /^\d{4}-\d{2}$/.test(searchParams.mes) ? searchParams.mes : null
  const pagina = Math.max(1, Number(searchParams.p) || 1)

  let dados: PaginaHistorico = { itens: [], total: 0, pagina: 1, paginas: 1 }
  let meses: string[] = []
  let erro = false
  try {
    ;[dados, meses] = await Promise.all([
      listarHistorico({ mes: mes ?? undefined, pagina }),
      listarMesesHistorico(),
    ])
  } catch {
    erro = true
  }

  const url = (p: number) => `/formularios/historico?${mes ? `mes=${mes}&` : ""}p=${p}`

  return (
    <div className="space-y-4 pt-2">
      {/* cabeçalho igual ao atual, trocando o texto de apoio: */}
      {/* <p …>{dados.total} checklist(s) {mes ? "neste mês" : "no total"}, dos mais recentes para os mais antigos.</p> */}

      <FiltroMes meses={meses} atual={mes} />

      {/* bloco de erro igual ao atual */}

      {!erro && dados.itens.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#D9CCEA] p-6 text-center">
          <p className="text-sm text-[#6B5E7B]">
            {mes ? "Nenhum checklist neste mês." : "Nenhum checklist enviado ainda."}
          </p>
          <Link href="/formularios/carregamento" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4B0085]">
            <Plus className="h-4 w-4" /> Preencher o primeiro
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {dados.itens.map((i) => (
          <Link key={i.id} href={`/formularios/historico/${i.id}`} className="block rounded-[24px] border border-[#EDE4F5] bg-white p-4 transition active:scale-[.995]">
            {/* mesmo conteúdo do card de hoje, com um <ChevronRight className="h-4 w-4 text-[#A99BBB]" /> ao lado do "nº {i.id}" */}
          </Link>
        ))}
      </div>

      {!erro && dados.paginas > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          {dados.pagina > 1 ? (
            <Link href={url(dados.pagina - 1)} className="h-10 flex-1 rounded-[14px] border border-[#E7DEED] bg-white text-center text-[13px] font-semibold leading-10 text-[#4B0085]">
              Anteriores
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          <span className="text-[11px] font-semibold text-[#8F82A0]">
            página {dados.pagina} de {dados.paginas}
          </span>
          {dados.pagina < dados.paginas ? (
            <Link href={url(dados.pagina + 1)} className="h-10 flex-1 rounded-[14px] border border-[#E7DEED] bg-white text-center text-[13px] font-semibold leading-10 text-[#4B0085]">
              Próximos
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </div>
      )}
    </div>
  )
}
```

Preencher os trechos comentados copiando o markup que já existe no arquivo (card, cabeçalho, bloco de erro) — não reescrever de memória.

- [ ] **Step 3: Tela de detalhe**

Create `src/app/formularios/historico/[id]/page.tsx`:

```tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarClock, HardHat, Lock, MessageSquareWarning, Truck, UserCheck, Users } from "lucide-react"
import { Cartao, Pilula } from "@/components/formularios/ui"
import { obterChecklist } from "@/lib/formularios/checklist"
import { formatarFuncao, iniciais } from "@/lib/formularios/regras"

export const dynamic = "force-dynamic"

const TZ = "America/Sao_Paulo"
const dataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const ROTULO_EPI: Record<string, { texto: string; cor: string; fundo: string }> = {
  sim: { texto: "Sim", cor: "#1B7A4B", fundo: "rgba(27,122,75,.10)" },
  na: { texto: "N/A", cor: "#4B0085", fundo: "#F4F0FB" },
  nao: { texto: "Não", cor: "#C42B2B", fundo: "rgba(196,43,43,.10)" },
}

export default async function DetalheChecklistPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id) || id < 1) notFound()

  let item
  try {
    item = await obterChecklist(id)
  } catch {
    return (
      <div className="pt-6">
        <p className="rounded-xl bg-[rgba(217,45,45,.08)] p-3 text-sm font-medium text-[#C42B2B]">
          Não foi possível abrir este checklist agora. Tente de novo em instantes.
        </p>
      </div>
    )
  }
  if (!item) notFound()

  return (
    <div className="space-y-3.5 pt-2">
      <div>
        <Link href="/formularios/historico" className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4B0085]">
          <ArrowLeft className="h-3.5 w-3.5" /> Histórico
        </Link>
        <h1 className="mt-3 font-display text-[26px] font-semibold tracking-tight text-[#201429]">
          Carregamento nº {item.id}
        </h1>
        <p className="mt-1 text-sm text-[#6B5E7B]">Enviado por {item.enviadoPor} em {dataHora.format(new Date(item.enviadoEm))}.</p>
      </div>

      <Cartao icone={CalendarClock} titulo="Período" subtitulo="Início e fim do carregamento">
        <div className="space-y-1 text-[13px] text-[#201429]">
          <p><span className="text-[#6D5E78]">Início:</span> {dataHora.format(new Date(item.inicioEm))}</p>
          <p><span className="text-[#6D5E78]">Fim:</span> {dataHora.format(new Date(item.fimEm))}</p>
        </div>
      </Cartao>

      <Cartao icone={Users} titulo="Equipe" subtitulo={`${item.operadores.length} operadores`}>
        <div className="space-y-2">
          {item.operadores.map((o, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-2xl border border-[#E7DEED] bg-white py-2.5 pl-3 pr-2.5">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] bg-[#F4F0FB] text-[11px] font-bold text-[#4B0085]">
                {iniciais(o.nome)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-semibold text-[#201429]">{o.nome}</span>
                <span className="truncate text-[10px] text-[#6D5E78]">{formatarFuncao(o.funcao)}</span>
              </span>
            </div>
          ))}
        </div>
      </Cartao>

      <Cartao icone={HardHat} titulo="EPIs" subtitulo="Verificação da equipe">
        <div className="divide-y divide-[#F1EBF8]">
          {item.epis.map((e) => {
            const r = ROTULO_EPI[e.status] ?? ROTULO_EPI.na
            return (
              <div key={e.codigo} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-[13px] font-semibold text-[#201429]">{e.nome}</span>
                <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ color: r.cor, background: r.fundo }}>
                  {r.texto}
                </span>
              </div>
            )
          })}
        </div>
      </Cartao>

      <Cartao icone={Truck} titulo="Veículo" subtitulo={`Nº ${item.veiculoNumero} · ${item.veiculoCapacidade}`}>
        <div className="flex flex-wrap gap-1.5">
          {item.lacres.length === 0 && <p className="text-[13px] text-[#6D5E78]">Sem lacres registrados.</p>}
          {item.lacres.map((l, i) => (
            <Pilula key={i} className="border border-[#E7DEED] bg-white">
              <Lock className="mr-1 h-3 w-3" /> {l}
            </Pilula>
          ))}
        </div>
      </Cartao>

      <Cartao icone={UserCheck} titulo="Responsáveis">
        <div className="space-y-1 text-[13px] text-[#201429]">
          <p><span className="text-[#6D5E78]">Supervisor:</span> {item.supervisorNome} · {formatarFuncao(item.supervisorFuncao)}</p>
          <p><span className="text-[#6D5E78]">Líder:</span> {item.liderNome} · {formatarFuncao(item.liderFuncao)}</p>
        </div>
      </Cartao>

      {item.ocorrencia && (
        <Cartao icone={MessageSquareWarning} titulo="Ocorrência">
          <p className="whitespace-pre-wrap text-[13px] text-[#201429]">{item.ocorrencia}</p>
        </Cartao>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: limpo (o erro de tipo deixado pela Task 4 some ao atualizar o chamador), testes passando, build com as rotas `/formularios/historico` e `/formularios/historico/[id]`.

- [ ] **Step 5: Commit**

```bash
git add src/app/formularios/historico src/components/formularios/FiltroMes.tsx
git commit -m "feat: historico com filtro de mes, paginacao e tela de detalhe"
```

---

### Task 6: Verificação final do increment 2 (com o usuário)

**Files:** nenhum novo (só correções que a verificação revelar).

- [ ] **Step 1: Suíte completa**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: tudo verde.

- [ ] **Step 2: Servidor para o usuário**

`npm run build` já rodou; subir com `npm run start -- -p 3000` em segundo plano e confirmar `/login` 200 e `/formularios` 307 para quem não está logado. O usuário faz a conferência logado (nenhum agente consegue autenticar).

- [ ] **Step 3: Roteiro de conferência para o usuário**

1. `/formularios`: só o card de Carregamento e o link do histórico — nenhum "Em breve".
2. Etapa 1: tocar em início/fim abre o calendário; escolher dia e hora e confirmar; o campo mostra `11/09/2026 · 07:30`.
3. Etapa 4: supervisor e líder abrem painel com busca; ao escolher, o painel fecha e o nome aparece no campo.
4. Histórico: filtro de mês abre painel e filtra; paginação aparece com mais de 20 registros; tocar num item abre o detalhe com equipe, 7 EPIs, veículo, lacres, responsáveis e ocorrência.
5. Envio do checklist de teste autorizado (ocorrência `TESTE — pode desconsiderar`) — este é o envio único já autorizado pelo usuário em 2026-09-11.

- [ ] **Step 4: Conferência no banco (somente leitura)**

Com o nº do registro informado pelo usuário, conferir 1 linha no cabeçalho, N operadores e 7 EPIs — apenas SELECT.

- [ ] **Step 5: Commit de ajustes (se houver)**

```bash
git add -A src
git commit -m "fix: ajustes da verificacao do increment 2"
```
