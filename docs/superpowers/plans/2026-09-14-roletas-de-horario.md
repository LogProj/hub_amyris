# Horário por roletas de hora e minuto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o horário do `DataHoraSheet` por **duas roletas** (hora e minuto), removendo a grade com 48 horários e o campo de texto. Sem segundos.

**Architecture:** Um componente `Roleta` genérico (coluna rolável com scroll-snap, faixa de seleção fixa no centro, item escolhido = o que estiver no centro) usado duas vezes dentro do painel que já existe. O valor gravado continua `"YYYY-MM-DDTHH:mm"`.

**Tech Stack:** Next.js 14 (App Router) + TypeScript strict + Tailwind 3.4 + vitest.

**Spec:** `docs/superpowers/specs/2026-09-10-checklist-carregamento-design.md` (o horário é o único ponto que muda)

## Contexto da decisão (2026-09-14)

O usuário viu a versão com a grade de 48 horários mais um campo de texto e pediu: *"o calendário não precisa ter cada horário disponível pro usuário clicar, tem que ser algo simples que permita ele escolher o minuto"*. Perguntado, escolheu **roletas de hora e minuto** e confirmou que **não precisa de segundos**.

## Global Constraints

- O valor gravado continua **`"YYYY-MM-DDTHH:mm"`** (hora de Brasília, UTC−03:00 fixo). `regras.ts`, `ChecklistWizard.tsx`, `paraDataBrasilia` e o contrato `onConfirmar` **não mudam**.
- **Nenhum seletor nativo** (`datetime-local`, `<input type="time">`, `<select>`).
- O painel continua sendo o `Sheet` existente (`createPortal` + `fixed`) — regra do CLAUDE.md.
- Sem segundos em lugar nenhum.
- A **grade de 48 horários** (`HORAS`) e o **campo de texto de hora** saem da tela.
- Continua impossível confirmar sem dia **e** horário válidos.
- Textos em português, sem termos técnicos; vocabulário visual atual (`GRAD`, `#201429`, `#6D5E78`, `#E7DEED`, raio 14px, campos 46px).
- `npm test` + `npx tsc --noEmit` + `npm run build` limpos. **NUNCA** `prisma db push`/`migrate`; nada de escrita no banco.
- Não iniciar nem parar servidores (há um rodando na porta 3000 para o usuário).

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/formularios/calendario.ts` (+ `.test.ts`) | `HORAS_DO_DIA`, `MINUTOS`; remove `HORAS` e `normalizarHora`; mantém `horaValida`, `separar`, `juntar`, `formatarDataHora`, `gradeDoMes`, `rotuloMesAno`, `hojeBrasilia` |
| `src/components/formularios/Roleta.tsx` | roleta genérica (coluna com scroll-snap) |
| `src/components/formularios/DataHoraSheet.tsx` | usa duas roletas no lugar da grade + campo de texto |

---

### Task 1: Roletas de hora e minuto

**Files:**
- Modify: `src/lib/formularios/calendario.ts`, `src/lib/formularios/calendario.test.ts`, `src/components/formularios/DataHoraSheet.tsx`
- Create: `src/components/formularios/Roleta.tsx`

**Interfaces:**
- Produces, de `@/lib/formularios/calendario`:
  - `HORAS_DO_DIA: string[]` — `"00"`…`"23"` (24 itens)
  - `MINUTOS: string[]` — `"00"`…`"59"` (60 itens)
  - **Removidos:** `HORAS` (os 48 slots) e `normalizarHora` (não há mais digitação livre)
  - Mantidos sem mudança: `separar`, `juntar`, `formatarDataHora`, `horaValida`, `rotuloMesAno`, `gradeDoMes`, `hojeBrasilia`
- Produces, de `./Roleta`: `Roleta({ rotulo, itens, valor, onMudar }): JSX.Element`

- [ ] **Step 1: Testes das listas (falhando)**

Em `src/lib/formularios/calendario.test.ts`: **apagar** o bloco `describe("HORAS", …)` e os testes de `normalizarHora`, e acrescentar:

```ts
import { HORAS_DO_DIA, MINUTOS } from "./calendario"

describe("listas das roletas", () => {
  it("tem 24 horas, de 00 a 23", () => {
    expect(HORAS_DO_DIA).toHaveLength(24)
    expect(HORAS_DO_DIA[0]).toBe("00")
    expect(HORAS_DO_DIA[23]).toBe("23")
  })
  it("tem 60 minutos, de 00 a 59", () => {
    expect(MINUTOS).toHaveLength(60)
    expect(MINUTOS[0]).toBe("00")
    expect(MINUTOS[45]).toBe("45")
    expect(MINUTOS[59]).toBe("59")
  })
  it("todos com dois dígitos", () => {
    for (const v of [...HORAS_DO_DIA, ...MINUTOS]) expect(v).toMatch(/^\d{2}$/)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- calendario`
Expected: FAIL — `HORAS_DO_DIA` não existe.

- [ ] **Step 3: Implementar as listas**

Em `src/lib/formularios/calendario.ts`: remover `HORAS` e `normalizarHora` (e o regex auxiliar que só elas usavam) e acrescentar:

```ts
/** Itens das roletas de horário (hora e minuto, sem segundos). */
export const HORAS_DO_DIA: string[] = Array.from({ length: 24 }, (_, i) => dois(i))
export const MINUTOS: string[] = Array.from({ length: 60 }, (_, i) => dois(i))
```

(`dois` já existe no módulo.)

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS. `npx tsc --noEmit` vai apontar o `DataHoraSheet` (ainda usa `HORAS`/`normalizarHora`) — esperado, o Step 5 resolve.

- [ ] **Step 5: A roleta**

Create `src/components/formularios/Roleta.tsx`:

```tsx
"use client"

import { useEffect, useRef } from "react"

const ALTURA = 40 // altura de cada item, em px
const VISIVEIS = 5 // itens visíveis na janela (ímpar, para ter um centro)

/**
 * Coluna rolável no estilo "roleta": o item que parar no centro é o escolhido.
 * Usa scroll-snap do navegador (sem biblioteca) e também aceita toque direto no item.
 */
export function Roleta({
  rotulo,
  itens,
  valor,
  onMudar,
}: {
  rotulo: string
  itens: string[]
  valor: string
  onMudar: (valor: string) => void
}) {
  const refLista = useRef<HTMLDivElement>(null)
  const rolando = useRef<ReturnType<typeof setTimeout> | null>(null)
  const indice = Math.max(0, itens.indexOf(valor))

  // Posiciona a roleta no valor atual (ao abrir e quando o valor muda de fora).
  useEffect(() => {
    const lista = refLista.current
    if (!lista) return
    const alvo = indice * ALTURA
    if (Math.abs(lista.scrollTop - alvo) > 1) lista.scrollTop = alvo
  }, [indice])

  // Ao parar de rolar, o item do centro vira o valor escolhido.
  function aoRolar() {
    const lista = refLista.current
    if (!lista) return
    if (rolando.current) clearTimeout(rolando.current)
    rolando.current = setTimeout(() => {
      const i = Math.min(itens.length - 1, Math.max(0, Math.round(lista.scrollTop / ALTURA)))
      if (itens[i] !== valor) onMudar(itens[i])
    }, 90)
  }

  const espaco = ((VISIVEIS - 1) / 2) * ALTURA

  return (
    <div className="flex flex-1 flex-col items-center">
      <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A79BB0]">{rotulo}</span>
      <div className="relative w-full" style={{ height: VISIVEIS * ALTURA }}>
        {/* faixa de seleção fixa no centro */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-[14px] border border-[rgba(124,58,237,.35)] bg-[#F7F3FD]"
          style={{ height: ALTURA }}
        />
        <div
          ref={refLista}
          onScroll={aoRolar}
          role="listbox"
          aria-label={rotulo}
          tabIndex={0}
          className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          <div style={{ height: espaco }} />
          {itens.map((item) => {
            const ativo = item === valor
            return (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={ativo}
                onClick={() => onMudar(item)}
                className="flex w-full snap-center items-center justify-center text-[17px] transition"
                style={{
                  height: ALTURA,
                  color: ativo ? "#201429" : "#A79BB0",
                  fontWeight: ativo ? 700 : 500,
                }}
              >
                {item}
              </button>
            )
          })}
          <div style={{ height: espaco }} />
        </div>
      </div>
    </div>
  )
}
```

Se `scrollbar-none` não existir no projeto, esconder a barra com `[&::-webkit-scrollbar]:hidden` na mesma `className` (e manter `scrollbarWidth: "none"` no style).

- [ ] **Step 6: O painel usa as duas roletas**

Em `src/components/formularios/DataHoraSheet.tsx`:
- remover o campo de texto de hora, sua mensagem de erro, o estado `horaTexto` e tudo que vinha de `normalizarHora`/`HORAS`;
- manter o calendário e o botão "Confirmar" como estão;
- estado do horário passa a ser `const [hora, setHora] = useState(inicial.hora)` (formato `"HH:MM"`), com o `useEffect` de reabertura re-semeando a partir de `separar(valor).hora`;
- derivar as partes: `const [hh, mm] = hora ? hora.split(":") : ["", ""]`;
- renderizar, no lugar da antiga grade:

```tsx
<p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A79BB0]">Horário</p>
<div className="flex items-stretch gap-3 rounded-[14px] border border-[#E7DEED] bg-white px-3 py-2">
  <Roleta rotulo="Hora" itens={HORAS_DO_DIA} valor={hh || "07"} onMudar={(h) => setHora(`${h}:${mm || "00"}`)} />
  <span className="self-center text-xl font-bold text-[#6D5E78]">:</span>
  <Roleta rotulo="Minuto" itens={MINUTOS} valor={mm || "00"} onMudar={(m) => setHora(`${hh || "07"}:${m}`)} />
</div>
```

- `pronto` passa a ser `!!data && horaValida(hora)`; o "Confirmar" continua `disabled={!pronto}` e emite `juntar(data, hora)`.
- Quando o campo ainda não tem horário, as roletas mostram `07:00` como ponto de partida, mas **só valem depois que a pessoa mexer**: se `hora` estiver vazio, `pronto` é falso e o botão fica desabilitado até ela escolher (rolar ou tocar).

- [ ] **Step 7: Verificar**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: limpo, sem resquícios de `HORAS`/`normalizarHora` (`grep -rn "normalizarHora\|\bHORAS\b" src` não deve retornar nada fora de `HORAS_DO_DIA`).

- [ ] **Step 8: Commit**

```bash
git add src/lib/formularios/calendario.ts src/lib/formularios/calendario.test.ts src/components/formularios/Roleta.tsx src/components/formularios/DataHoraSheet.tsx
git commit -m "feat: horario por roletas de hora e minuto"
```

---

### Task 2: Verificação com o usuário

- [ ] **Step 1:** `npm test && npx tsc --noEmit && npm run build` (parar o servidor antes, se o build reclamar do engine do Prisma).
- [ ] **Step 2:** subir `npm run start -- -p 3000` e confirmar `/login` 200.
- [ ] **Step 3:** roteiro: abrir o período, girar as roletas até `11:45`, confirmar, ver o campo mostrando `14/09/2026 · 11:45`; conferir que não há mais grade de horários nem campo de digitação; enviar o checklist de teste autorizado.
- [ ] **Step 4:** conferência no banco (somente leitura) do minuto exato gravado.
