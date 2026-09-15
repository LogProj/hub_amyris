# Seletor de dia e hora compacto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar a escolha de dia e hora **compacta e simples**: atalhos de dia (Ontem / Hoje / Outro dia), hora digitada em dois campos grandes com botão "Agora", calendário só sob demanda. Some a roleta. E renomear a 4ª aba do wizard de "Fecho" para "Responsável".

**Architecture:** O `DataHoraSheet` deixa de abrir com o mês inteiro + roletas e passa a abrir com duas linhas: **Dia** (3 botões) e **Horário** (HH : MM + "Agora"). O calendário existente (`gradeDoMes`) só é renderizado quando a pessoa toca em "Outro dia". Funções puras novas em `calendario.ts`, com vitest. Valor gravado continua `"YYYY-MM-DDTHH:mm"`.

**Tech Stack:** Next.js 14 (App Router) + TypeScript strict + Tailwind 3.4 + vitest.

**Spec:** `docs/superpowers/specs/2026-09-10-checklist-carregamento-design.md`

## Contexto da decisão (2026-09-14)

Sequência de pedidos do usuário sobre este campo: seletor nativo → painel com 48 sugestões + texto → "qualquer minuto" → roletas → agora **"algo mais compacto e simples, foco na experiência"**. O padrão de uso real (carregamento registrado no pátio, quase sempre de hoje ou de ontem, com minuto exato) diz que o mês inteiro é caro para o caso comum e que digitar o minuto é mais rápido do que girar.

Regras aplicadas do guia de UI/UX (a busca da skill não está instalada; as regras vêm do próprio SKILL.md):
- **progressive-disclosure** — o calendário completo é a exceção, não o padrão.
- **touch-target-size / touch-friendly-input** — alvos ≥44px, campos de 52px.
- **input-type-keyboard** — `inputMode="numeric"` para abrir o teclado de números.
- **number-tabular** — dígitos tabulares para a hora não "dançar".
- **primary-action** — um CTA só ("Confirmar"); "Agora" é secundário.
- **input-labels / error-clarity** — rótulo visível e erro com como corrigir.
- **duration-timing / reduced-motion** — expansão do calendário em 200ms, respeitando `prefers-reduced-motion`.
- **state-clarity** — dia escolhido com o gradiente da marca; demais em contorno.

## Global Constraints

- Valor gravado continua **`"YYYY-MM-DDTHH:mm"`** (Brasília, UTC−03:00 fixo). `regras.ts`, `ChecklistWizard.tsx` (fora o rótulo da aba) e `paraDataBrasilia` não mudam.
- **Sem segundos. Sem seletor nativo** (`datetime-local`, `input[type=time]`, `<select>`). Campos de texto com teclado numérico são permitidos.
- Overlay só via o `Sheet` existente (`createPortal` + `fixed`) — regra do CLAUDE.md.
- **Remover** `Roleta.tsx`, `HORAS_DO_DIA` e `MINUTOS` (e seus testes) — ninguém mais usa.
- Alvos de toque ≥44px; campos de hora 52px de altura; `inputMode="numeric"`; dígitos tabulares.
- Textos em português, sem termos técnicos; paleta atual (`GRAD`, `#201429`, `#6D5E78`, `#E7DEED`, `#F4F0FB`).
- `npm test` + `npx tsc --noEmit` + `npx next build` limpos. **NUNCA** `prisma db push`/`migrate`; nada de escrita no banco; não iniciar nem parar servidores.

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/formularios/calendario.ts` (+ `.test.ts`) | `hojeBrasilia` (já existe), `ontemBrasilia`, `agoraBrasilia`, `rotuloDiaCurto`, `doisDigitos`; remove `HORAS_DO_DIA`/`MINUTOS` |
| `src/components/formularios/DataHoraSheet.tsx` | novo layout compacto |
| `src/components/formularios/Roleta.tsx` | **apagado** |
| `src/components/formularios/ChecklistWizard.tsx` | aba "Fecho" → "Responsável" |

---

### Task 1: Seletor compacto + renomear a aba

**Files:**
- Modify: `src/lib/formularios/calendario.ts`, `src/lib/formularios/calendario.test.ts`, `src/components/formularios/DataHoraSheet.tsx`, `src/components/formularios/ChecklistWizard.tsx`
- Delete: `src/components/formularios/Roleta.tsx`

**Interfaces:**
- Produces, de `@/lib/formularios/calendario`:
  - `ontemBrasilia(): string` — `"YYYY-MM-DD"` de ontem em São Paulo
  - `agoraBrasilia(): string` — `"HH:MM"` de agora em São Paulo
  - `rotuloDiaCurto(data: string): string` — `"Hoje"`, `"Ontem"` ou `"14/09"`; `""` se vazio
  - `doisDigitos(bruto: string, max: number): string` — mantém só dígitos, corta em 2, e devolve `""` se passar de `max` (ex.: `doisDigitos("7", 23) === "7"`, `doisDigitos("25", 23) === ""`)
  - **Removidos:** `HORAS_DO_DIA`, `MINUTOS`
  - Mantidos: `separar`, `juntar`, `formatarDataHora`, `horaValida`, `gradeDoMes`, `rotuloMesAno`, `hojeBrasilia`

- [ ] **Step 1: Testes das funções novas (falhando)**

Em `src/lib/formularios/calendario.test.ts`: **apagar** o `describe("listas das roletas", …)` e acrescentar:

```ts
import { doisDigitos, ontemBrasilia, rotuloDiaCurto, hojeBrasilia } from "./calendario"

describe("ontemBrasilia", () => {
  it("é um dia antes de hoje", () => {
    const hoje = new Date(`${hojeBrasilia()}T12:00:00-03:00`)
    const ontem = new Date(`${ontemBrasilia()}T12:00:00-03:00`)
    expect(Math.round((hoje.getTime() - ontem.getTime()) / 86400000)).toBe(1)
  })
  it("tem o formato YYYY-MM-DD", () => {
    expect(ontemBrasilia()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe("rotuloDiaCurto", () => {
  it("nomeia hoje e ontem", () => {
    expect(rotuloDiaCurto(hojeBrasilia())).toBe("Hoje")
    expect(rotuloDiaCurto(ontemBrasilia())).toBe("Ontem")
  })
  it("mostra dia/mês para outras datas", () => {
    expect(rotuloDiaCurto("2026-03-07")).toBe("07/03")
  })
  it("devolve vazio quando não há data", () => {
    expect(rotuloDiaCurto("")).toBe("")
  })
})

describe("doisDigitos", () => {
  it("mantém o que está dentro do limite", () => {
    expect(doisDigitos("7", 23)).toBe("7")
    expect(doisDigitos("07", 23)).toBe("07")
    expect(doisDigitos("23", 23)).toBe("23")
    expect(doisDigitos("59", 59)).toBe("59")
  })
  it("descarta o que passa do limite", () => {
    expect(doisDigitos("25", 23)).toBe("")
    expect(doisDigitos("60", 59)).toBe("")
  })
  it("ignora o que não é dígito e corta em dois", () => {
    expect(doisDigitos("1a", 23)).toBe("1")
    expect(doisDigitos("123", 23)).toBe("12")
    expect(doisDigitos("", 23)).toBe("")
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- calendario`
Expected: FAIL — `ontemBrasilia is not a function`.

- [ ] **Step 3: Implementar as funções**

Em `src/lib/formularios/calendario.ts`: remover `HORAS_DO_DIA` e `MINUTOS`; acrescentar:

```ts
/** Ontem em São Paulo, como "YYYY-MM-DD". */
export function ontemBrasilia(): string {
  const hoje = new Date(`${hojeBrasilia()}T12:00:00-03:00`)
  hoje.setUTCDate(hoje.getUTCDate() - 1)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(hoje)
}

/** Agora em São Paulo, como "HH:MM". */
export function agoraBrasilia(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date())
}

/** "Hoje", "Ontem" ou "dd/MM" — o rótulo curto do dia escolhido. */
export function rotuloDiaCurto(data: string): string {
  if (!data) return ""
  if (data === hojeBrasilia()) return "Hoje"
  if (data === ontemBrasilia()) return "Ontem"
  const [, mes, dia] = data.split("-")
  return `${dia}/${mes}`
}

/** Campo de 2 dígitos com teto (hora 23, minuto 59). Fora do teto, devolve "". */
export function doisDigitos(bruto: string, max: number): string {
  const digitos = (bruto ?? "").replace(/\D/g, "").slice(0, 2)
  if (!digitos) return ""
  return Number(digitos) > max ? "" : digitos
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS (o `tsc` ainda acusa `DataHoraSheet`/`Roleta` — o Step 5 resolve).

- [ ] **Step 5: O painel compacto**

Reescrever o corpo de `src/components/formularios/DataHoraSheet.tsx` (mantendo props, o `Sheet`, o `useEffect` de reabertura e o botão "Confirmar"):

Estado: `data`, `hh`, `mm`, `mostrarCalendario` (boolean), `ano`, `mes` (só usados quando o calendário abre). Ao reabrir, re-semear tudo de `separar(valor)`; `mostrarCalendario` volta a `false`, exceto se a data escolhida não for hoje nem ontem (aí abre já mostrando o mês daquela data).

Layout, de cima para baixo:

```tsx
{/* DIA */}
<p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A79BB0]">Dia</p>
<div className="flex gap-2">
  {[
    { rotulo: "Ontem", valor: ontemBrasilia() },
    { rotulo: "Hoje", valor: hojeBrasilia() },
  ].map((op) => {
    const ativo = data === op.valor && !mostrarCalendario
    return (
      <button
        key={op.valor}
        type="button"
        onClick={() => { setData(op.valor); setMostrarCalendario(false) }}
        aria-pressed={ativo}
        className="h-[46px] flex-1 rounded-[14px] border text-[14px] font-semibold transition"
        style={{
          background: ativo ? GRAD : "#fff",
          color: ativo ? "#fff" : "#201429",
          borderColor: ativo ? "transparent" : "#E7DEED",
        }}
      >
        {op.rotulo}
      </button>
    )
  })}
  <button
    type="button"
    onClick={() => setMostrarCalendario((v) => !v)}
    aria-expanded={mostrarCalendario}
    className="flex h-[46px] flex-1 items-center justify-center gap-1.5 rounded-[14px] border text-[14px] font-semibold transition"
    style={{
      background: outroDiaAtivo ? GRAD : "#fff",
      color: outroDiaAtivo ? "#fff" : "#201429",
      borderColor: outroDiaAtivo ? "transparent" : "#E7DEED",
    }}
  >
    <CalendarDays className="h-[17px] w-[17px]" />
    {outroDiaAtivo ? rotuloDiaCurto(data) : "Outro dia"}
  </button>
</div>
```

…onde `const outroDiaAtivo = !!data && data !== hojeBrasilia() && data !== ontemBrasilia()`.

O calendário (o mesmo `gradeDoMes` de hoje, com as setas de mês) só é renderizado quando `mostrarCalendario` for `true`, dentro de um contêiner com `motion-safe:animate-[abrir_200ms_ease-out]` (definir o keyframe `abrir` em `tailwind.config.ts`: de `opacity:0; transform:translateY(-4px)` para `opacity:1; transform:none`). Ao escolher um dia no calendário, fechar o calendário (`setMostrarCalendario(false)`).

```tsx
{/* HORÁRIO */}
<p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A79BB0]">Horário</p>
<div className="flex items-center gap-2">
  <label className="sr-only" htmlFor="campo-hora">Hora</label>
  <input
    id="campo-hora"
    value={hh}
    onChange={(e) => { const v = doisDigitos(e.target.value, 23); setHh(v); if (v.length === 2) refMinuto.current?.focus() }}
    inputMode="numeric"
    placeholder="--"
    maxLength={2}
    aria-label="Hora"
    className="h-[52px] w-[74px] rounded-[14px] border border-[#E7DEED] bg-white text-center text-[22px] font-bold tabular-nums text-[#201429] outline-none focus:border-[rgba(75,0,133,.5)] focus:shadow-[0_0_0_3px_rgba(75,0,133,.16)]"
  />
  <span className="text-[22px] font-bold text-[#6D5E78]">:</span>
  <label className="sr-only" htmlFor="campo-minuto">Minuto</label>
  <input
    id="campo-minuto"
    ref={refMinuto}
    value={mm}
    onChange={(e) => setMm(doisDigitos(e.target.value, 59))}
    inputMode="numeric"
    placeholder="--"
    maxLength={2}
    aria-label="Minuto"
    className="h-[52px] w-[74px] rounded-[14px] border border-[#E7DEED] bg-white text-center text-[22px] font-bold tabular-nums text-[#201429] outline-none focus:border-[rgba(75,0,133,.5)] focus:shadow-[0_0_0_3px_rgba(75,0,133,.16)]"
  />
  <button
    type="button"
    onClick={() => { const [h, m] = agoraBrasilia().split(":"); setHh(h); setMm(m) }}
    className="ml-auto h-[46px] rounded-[14px] border border-[rgba(124,58,237,.35)] bg-[#F4F0FB] px-4 text-[14px] font-semibold text-[#4B0085]"
  >
    Agora
  </button>
</div>
```

Ao sair do campo (`onBlur`), completar com zero à esquerda: `if (hh.length === 1) setHh(hh.padStart(2, "0"))` (idem para `mm`).

`const hora = hh.length === 2 && mm.length === 2 ? `${hh}:${mm}` : ""`; `const pronto = !!data && horaValida(hora)`; "Confirmar" emite `juntar(data, hora)`.

Mensagem de erro (só depois que a pessoa mexeu e o valor está incompleto): "Informe hora e minuto, por exemplo 07 e 45."

- [ ] **Step 6: Apagar a roleta e renomear a aba**

- `git rm src/components/formularios/Roleta.tsx` (nenhum outro arquivo a importa — conferir com `grep -rn "Roleta" src`).
- Em `src/components/formularios/ChecklistWizard.tsx`, no array `ABAS`, trocar `"Fecho"` por `"Responsável"`. **Não** mexer em `TITULOS` (o título da etapa 4 continua "Responsáveis").

- [ ] **Step 7: Verificar**

Run: `npx tsc --noEmit && npm test && npx next build`
Expected: limpo. `grep -rn "Roleta\|HORAS_DO_DIA\|MINUTOS" src` não deve retornar nada.

Conferir na leitura do código: o painel abre mostrando **duas linhas** (Dia e Horário) e o botão Confirmar — sem o mês inteiro.

- [ ] **Step 8: Commit**

```bash
git add -A src/lib/formularios src/components/formularios tailwind.config.ts
git commit -m "feat: seletor de dia e hora compacto (atalhos de dia, hora digitada, calendario sob demanda) e aba Responsavel"
```

---

### Task 2: Verificação com o usuário

- [ ] **Step 1:** parar o servidor, `npm test && npx tsc --noEmit && npm run build`, subir `npm run start -- -p 3000`, confirmar `/login` 200.
- [ ] **Step 2:** roteiro: abrir o período — deve aparecer só Dia + Horário; tocar "Hoje" e digitar `11` `45`; usar "Agora"; tocar "Outro dia" para ver o calendário aparecer; confirmar e ver `14/09/2026 · 11:45`; conferir a aba 4 chamando-se **Responsável**.
- [ ] **Step 3:** envio do checklist de teste autorizado e conferência read-only no banco (minuto exato).
