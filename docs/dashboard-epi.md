# Painel de EPI (Utilização de EPIs) — hub_amyris

Painel **read-only** que mostra a **utilização de EPIs** do CR da AMYRIS, lendo os
dados do módulo de EPI que vive no **hub_inhaus** (banco compartilhado `db_inhaus`).

## Como funciona (e por que é seguro)

- Os dados de EPI (tabelas `epi_*`, `dm_cr`) são **gravados pelo hub_inhaus**. Aqui é
  **apenas leitura**.
- A leitura usa o pool `pg` já existente **`inhausPool`** (`src/lib/db-inhaus.ts`,
  env `DATABASE_URL_INHAUS`) — o **mesmo padrão** do `turnover.ts`/`headcount.ts`.
  **Nunca** via Prisma (o Prisma do amyris governa só o `db_amyris`/autorização) e
  **nunca** escreve — só `SELECT`. Zero risco às tabelas da SRA.
- Todo o painel é **escopado a UM CR**, definido pela env **`EPI_CR_FIXO`**
  (default: `96735 - SP - LOG - AMYRIS - BARRA BONITA`).

## Arquivos

| Arquivo | Papel |
|---|---|
| `src/lib/epi.ts` | `getEpiData(mes)` — SQL cru via `inhausPool`, escopado a `EPI_CR_FIXO`. Calcula aderência, conformidade, ausências e pendências do mês. |
| `src/components/dashboard/EpiCharts.tsx` | Gráficos Recharts (paleta roxa Amyris `#4B0085`): aderência ao longo do mês (área) + conformidade (donut). |
| `src/app/dashboards/epi/page.tsx` | Página (Server Component, `force-dynamic`): KPIs + gráficos + listas (não conformidades, ausências) + seletor de mês. Gate por papel (admin ou tela `epi` concedida). |
| `src/lib/screens.ts` | Registra a tela `epi` (concedível por usuário). |
| `src/components/dashboard/DashboardSidebar.tsx` | Item **EPI** no grupo Gestão. |

## Regras de cálculo (do mês selecionado, até hoje)

- **Esperado** = para cada turno do CR, os dias do mês em que ele espera preenchimento
  (`dias_semana`) × pessoas alocadas (`epi_atribuicao_turno`).
- **Aderência** = preenchimentos (respostas não-ausentes) ÷ esperados.
- **Não conformidade** = resposta com algum EPI marcado não conforme.
- **Ausência** = colaborador marcado ausente pelo líder no dia.
- **Dias pendentes** = dia esperado sem nenhum registro (sessão) do turno.

## Ambiente (envs)

- `DATABASE_URL_INHAUS` — Postgres do `db_inhaus` (já existia no projeto).
- `EPI_CR_FIXO` — o CR exibido (novo). Trocar o valor aponta o painel para outro CR.

Em produção (Vercel), garantir **ambas** setadas no ambiente.
