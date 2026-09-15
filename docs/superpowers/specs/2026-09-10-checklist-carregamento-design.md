# Checklist de Carregamento (mobile) — Design

**Data:** 2026-09-10 · **Status:** aprovado em brainstorming, aguardando revisão do spec
**Design de referência:** Claude Design, projeto `3b02397d-4282-4859-a4e8-e5067d244ade`,
arquivo `Checklist Carregamento Mobile.dc.html` (+ `support.js`). A implementação deve ser
**visualmente igual e funcional**.

## Objetivo

Permitir que a operação do CR **96735 - SP - LOG - AMYRIS - BARRA BONITA** registre, pelo
celular, o checklist de cada carregamento: equipe, EPIs, veículo/lacres, responsáveis e
ocorrências. É o primeiro de uma família de formulários (Ronda, Inspeção etc. aparecem como
"em breve").

## Telas

- **1A — Lista de formulários** (`/formularios`): card "Carregamento" disponível + cards
  "em breve" conforme o design.
- **1B — Checklist de Carregamento** (`/formularios/carregamento`): wizard de 4 etapas com
  tabs clicáveis, barra de progresso e CTA que vira "Enviar checklist" na etapa 4.
- **Histórico** (`/formularios/historico`): últimos 50 envios.
- Bottom-nav fixa em todas: Voltar / Início / Formulários / Sair.

## Arquitetura (abordagem A)

App mobile próprio dentro do hub, com shell dedicado (`max-w-[430px]`, safe-area,
bottom-nav, sem sidebar). O shell desktop dos dashboards não é tocado.

```
src/app/formularios/
  layout.tsx              # shell mobile; valida sessão (getSessionReadOnly), sem sidebar
  page.tsx                # 1A
  carregamento/page.tsx   # 1B
  historico/page.tsx      # histórico
src/components/formularios/
  MobileShell.tsx  BottomNav.tsx  ChecklistWizard.tsx  OperadoresSheet.tsx  ...
src/lib/formularios.ts    # leitura da SRA, tipos, validação pura (testável)
src/app/api/formularios/checklist-carregamento/route.ts  # POST (envio) + GET (histórico)
```

- **Acesso:** qualquer usuário logado no hub (global_auth). Não entra em `HUB_SCREENS` /
  controle por tela. `middleware.ts` ganha `/formularios` em `protectedRoutes` e no `matcher`.
- **Overlays:** bottom-sheet de operadores e qualquer dropdown seguem a regra do CLAUDE.md —
  `createPortal` para `document.body` + `fixed`.

## Fonte de pessoas (SRA)

Consulta única no snapshot mais recente de `public.vw_sra_amyris_diario` (`db_inhaus`, via
`inhausPool`), mesmo padrão de `turnover.ts`:

```sql
select distinct on (cpf) nome, cpf, descricao_funcao, escala, situacao
  from public.vw_sra_amyris_diario
 where dt_demissao is null
   and data_referencia = (select max(data_referencia) from public.vw_sra_amyris_diario)
 order by cpf, data_referencia desc
```

- **Todos os ativos**, sem filtro de situação (NORMAL / FÉRIAS / AFASTADO).
- Sob o nome exibe **só a função** (a SRA não tem matrícula). O CPF nunca aparece na tela e
  nunca sai do servidor: cada pessoa recebe um identificador opaco (HMAC do CPF), e é esse
  id — nunca o CPF — que chega ao navegador, ao rascunho no aparelho e às requisições.

| Campo | Funções aceitas |
|---|---|
| Operadores (N) | todas |
| Supervisor responsável | `SUPERVISOR DE LOGISTICA` |
| Líder responsável | `OPERADOR LOGISTICO LIDER` |

O recorte de cargo é validado **no servidor, no POST** (não só no filtro da tela).

## Wizard

1. **Equipe e período** — chips de operador (iniciais + função + remover); "Adicionar
   operador" abre bottom-sheet com busca por nome; data/hora de início e fim.
2. **EPIs da equipe** — Luva, Bota, Capacete, Óculos, Protetor Auricular, Cinto, Talabarte,
   cada um `Sim / N/A / Não`, valendo para a equipe; resumo "X de 7 verificados".
3. **Veículo e lacres** — nº, capacidade, lacres adicionados sob demanda (0 a 4).
4. **Responsáveis** — supervisor, líder, ocorrência (texto livre) e card de resumo.

### Regras de preenchimento (validadas no cliente e no servidor)

- Obrigatórios: ≥1 operador, início e fim (fim ≥ início), nº do veículo, capacidade,
  supervisor, líder e os 7 EPIs respondidos.
- **Se qualquer EPI = "Não", a ocorrência passa a ser obrigatória.**
- Lacres opcionais (máx. 4); ocorrência opcional nos demais casos.
- Operador não se repete na lista.

## Dados (`db_inhaus`, schema `public`, padrão dimensional dm_/ft_)

**Atenção (descoberto em 2026-09-11):** não existe `db_amyris`. O `DATABASE_URL` do Prisma
aponta para o **db_inhaus**, banco COMPARTILHADO (28 tabelas + 6 views de outros sistemas).
`prisma db push` / `migrate dev` apagariam tabelas alheias → **proibidos**. As tabelas são
criadas por SQL escrito à mão que só faz `CREATE TABLE IF NOT EXISTS` (aprovado pelo usuário).

| Tabela | Conteúdo |
|---|---|
| `dm_amyris_epi` | cadastro dos 7 EPIs (codigo, nome, ordem, ativo) |
| `ft_amyris_checklist_carregamento` | 1 linha por checklist enviado (período, veículo, lacres `text[]`, supervisor/líder cpf+nome+função, ocorrência, quem enviou, `enviado_em`) |
| `ft_amyris_checklist_carregamento_operador` | operadores de cada checklist (cpf, nome, função) |
| `ft_amyris_checklist_carregamento_epi` | resposta de cada EPI (`epi_codigo` → `dm_amyris_epi`, status `sim`/`na`/`nao`) |

- Nome e função gravados no envio (snapshot) — a SRA muda todo dia.
- EPI em dimensão: EPI novo é uma linha em `dm_amyris_epi`, não uma migration.
- Histórico é lido direto pela página (Server Component); não há GET na API.

## Envio, rascunho e histórico

- **POST** grava as 3 tabelas numa transação → limpa o rascunho → tela de confirmação com
  resumo e botões "Novo checklist" / "Ver histórico".
- **Rascunho** em `localStorage` a cada mudança, chave por usuário; ao reabrir oferece
  "Retomar preenchimento?". (Mitiga queda de sinal no pátio; não é offline-first.)
- **Histórico:** envios de **todos os usuários** (conferência entre turnos), filtrável por mês
  do carregamento e paginado (20 por página), com data, veículo, nº de operadores, resumo de
  EPIs e quem enviou — ver "Estado atual" abaixo.

## Verificação

- **vitest** (novo no projeto) cobrindo as funções puras de `lib/formularios.ts`: recorte de
  cargos, validação do payload (obrigatórios, fim ≥ início, máx. 4 lacres, EPI "Não" exige
  ocorrência, operador duplicado).
- `npm run build` + `npm run lint`.
- Smoke manual das telas em viewport 390×844 (lista, wizard completo, envio, histórico,
  rascunho retomado).

## Ajustes pedidos em 2026-09-14 (increment 2)

Depois de ver as telas rodando, o usuário pediu três mudanças. Plano:
`docs/superpowers/plans/2026-09-14-checklist-carregamento-ajustes.md`.

1. **Tela 1A sem os "Em breve".** Os formulários futuros (Inspeção Veicular, Inspeção de
   EPI, Registro de Ocorrência) saem da lista — não está definido que existirão.
2. **Campos de escolha em painel deslizante** (decisão do usuário), no mesmo padrão do
   painel de operadores: calendário com hora para início/fim; lista com busca para
   supervisor e líder. Nada de `datetime-local` nem `<select>` nativo.
3. **Histórico completo:** filtro por mês **do carregamento** (data de início), paginado
   (20 por página) e com **tela própria de detalhe** por checklist (`/formularios/historico/[id]`)
   mostrando operadores, os 7 EPIs, veículo, lacres, responsáveis, ocorrência e quem enviou.

## Fora de escopo

Offline-first/PWA, edição ou exclusão de checklist enviado, exportação, os formulários
"em breve", indicador de EPI a partir desses dados.

## Estado atual (2026-09-14)

Depois dos ajustes do increment 2 e da revisão final de código, o comportamento em produção é:

- **Identificador opaco por pessoa:** o CPF nunca sai do servidor — nem para a tela, nem para
  o rascunho salvo no aparelho, nem nas requisições. O que circula é um HMAC do CPF.
- **Rascunho saneado por whitelist e limpo ao sair:** ao reabrir o formulário, o rascunho salvo
  é reconstruído campo a campo (nunca espalhado) contra a escala atual — pessoas que saíram da
  escala somem da seleção; e se a escala não puder ser carregada, o rascunho não é oferecido
  nem sobrescrito, para não perder o preenchimento por engano. O rascunho é apagado do aparelho
  assim que o envio é confirmado.
- **Histórico filtrável por mês do carregamento**, 20 por página, com tela de detalhe própria
  por checklist.
- **Horário por roletas de hora e minuto** (sem segundos) — mantido como está hoje; não é um
  `datetime-local` nem `<select>` nativo.
- **Formulários "em breve" removidos da lista** — a tela 1A mostra só "Carregamento".
