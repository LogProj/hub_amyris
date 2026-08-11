import type { Metadata } from "next"
import nextDynamic from "next/dynamic"
import {
  FileText,
  AlertTriangle,
  ShieldAlert,
  Hand,
  Activity,
  Clock,
  Tag,
  Briefcase,
  CalendarDays,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { MonthFilter } from "@/components/dashboard/MonthFilter"
import { OcorrenciasInfo } from "@/components/dashboard/OcorrenciasInfo"
import { InfoDica } from "@/components/dashboard/InfoDica"
import { getSessionReadOnly } from "@/lib/auth-session"
import { getOcorrenciasData, type OcorrenciasData } from "@/lib/ocorrencias"

const MesBarChart = nextDynamic(() =>
  import("@/components/dashboard/OcorrenciasCharts").then((m) => m.MesBarChart),
)
const TurnoDonut = nextDynamic(() =>
  import("@/components/dashboard/OcorrenciasCharts").then((m) => m.TurnoDonut),
)

export const metadata: Metadata = { title: "Controle de Ocorrências" }
export const dynamic = "force-dynamic"

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function dataBR(iso: string) {
  const [a, m, d] = iso.split("-")
  return `${d}/${m}/${a}`
}

export default async function OcorrenciasPage({ searchParams }: { searchParams: { mes?: string } }) {
  // Gate por papel: admin ou quem tem a tela "ocorrencias" concedida.
  const s = await getSessionReadOnly()
  const auth = s.status === "ok" ? s.sessao.authorization : null
  const podeVer = Boolean(auth?.isAdmin || auth?.visibleScreens?.includes("ocorrencias"))
  if (!podeVer) {
    return (
      <div className="mt-8 rounded-2xl border border-amyris/10 bg-amyris-mist/50 p-6 text-sm text-muted-foreground">
        Você não tem acesso a este painel. Peça a um administrador para conceder a tela{" "}
        <strong>Controle de Ocorrências</strong>.
      </div>
    )
  }

  let data: OcorrenciasData | null = null
  let erro: string | null = null
  try {
    data = await getOcorrenciasData(searchParams.mes)
  } catch (e) {
    erro = e instanceof Error ? e.message : "Falha ao consultar as ocorrências."
  }

  if (erro || !data) {
    return (
      <div className="w-full space-y-6">
        <div className="reveal">
          <span className="eyebrow">Segurança</span>
          <div className="mt-3 flex items-center gap-2.5">
            <h1 className="font-display text-3xl font-semibold tracking-tight">Controle de Ocorrências</h1>
            <OcorrenciasInfo />
          </div>
        </div>
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Não foi possível carregar o painel de Ocorrências.</p>
            <p className="mt-1 text-destructive/80">{erro}</p>
          </div>
        </div>
      </div>
    )
  }

  const variacao = data.kpis.variacaoPct

  return (
    <div className="w-full space-y-6">
      {/* Cabeçalho + filtro */}
      <div className="reveal flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Segurança</span>
          <div className="mt-3 flex items-center gap-2.5">
            <h1 className="font-display text-3xl font-semibold tracking-tight">Controle de Ocorrências</h1>
            <OcorrenciasInfo />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Ocorrências sem envolvimento de pessoas — {data.clienteLabel}.
          </p>
        </div>
        <MonthFilter meses={data.meses} atual={data.mesAtual} basePath="/dashboards/ocorrencias" />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icone={FileText}
          rotulo="Total de Ocorrências"
          valor={data.kpis.total}
          detalhe="Todas as ocorrências"
          dica="Soma de todas as ocorrências já registradas na unidade, somando todos os meses. Serve para dar a dimensão do histórico."
        />
        <Kpi
          icone={AlertTriangle}
          rotulo="Ocorrências do Mês"
          valor={data.kpis.totalMes}
          detalhe={`${data.kpis.mesAnterior} no mês anterior`}
          variacao={variacao}
          dica="Quantas ocorrências aconteceram no mês selecionado. A setinha compara com o mês anterior: para baixo (verde) é bom, menos ocorrências; para cima (vermelho) é alerta."
        />
        <Kpi
          icone={ShieldAlert}
          rotulo="Condições Inseguras"
          valor={data.kpis.condicoesInseguras}
          detalhe="no mês"
          dica="Riscos no ambiente encontrados no mês, como piso molhado, corredor obstruído ou prateleira danificada. Não envolve pessoa machucada."
        />
        <Kpi
          icone={Hand}
          rotulo="Atos Inseguros"
          valor={data.kpis.atosInseguros}
          detalhe="no mês"
          dica="Comportamentos de risco observados no mês, como não usar proteção ou fazer um atalho perigoso. Registrado antes de virar acidente."
        />
      </div>

      {/* Calendário + Recentes */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="reveal glass flex h-[400px] flex-col rounded-2xl p-5">
          <TituloSecao icone={CalendarDays} texto="Calendário de Ocorrências" dica="Mostra em quais dias do mês houve ocorrências. Quanto mais forte a cor do dia, mais ocorrências naquele dia. Dias claros não tiveram registro." />
          <Calendario dias={data.calendario} />
        </section>

        <section className="reveal delay-1 glass flex h-[400px] flex-col rounded-2xl p-5">
          <TituloSecao icone={Activity} texto="Ocorrências Recentes" dica="Lista das últimas ocorrências registradas, da mais nova para a mais antiga, com quem reportou, a área, o tipo e quando aconteceu." />
          <ul className="mt-3 flex-1 divide-y divide-amyris/5 overflow-y-auto pr-1">
            {data.recentes.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amyris-mist text-amyris">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-[140px] flex-1">
                  <p className="font-medium leading-tight">{o.colaborador}</p>
                  <p className="text-[11px] text-muted-foreground">{o.negocio} · {o.local}</p>
                </div>
                <Pill texto={o.tipo} />
                <span className="ml-auto text-xs text-muted-foreground">{dataBR(o.data)} · {o.hora}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Ocorrências por mês */}
      <section className="reveal glass rounded-2xl p-5">
        <TituloSecao icone={Activity} texto="Ocorrências por Mês" dica="Evolução do número de ocorrências mês a mês ao longo do ano. Ajuda a ver se a tendência está subindo ou caindo." />
        <div className="mt-4">
          <MesBarChart data={data.porMes} />
        </div>
      </section>

      {/* Três colunas: Turno · Classificação · Negócio */}
      <div className="grid gap-4 md:grid-cols-3">
        <section className="reveal glass flex flex-col rounded-2xl p-5">
          <TituloSecao icone={Clock} texto="Por Turno" dica="Distribui as ocorrências do mês entre os turnos (1º, 2º e 3º). Mostra em qual período do dia elas se concentram." />
          <div className="mt-4">
            <TurnoDonut data={data.porTurno} />
          </div>
        </section>

        <Barras
          titulo="Classificação"
          icone={Tag}
          dica="Separa as ocorrências do mês em três grupos: condição insegura, ato inseguro e incidente material (avarias e danos). A barra maior é o grupo mais frequente."
          itens={data.porClassificacao.map((c) => ({ rotulo: c.classificacao, valor: c.count }))}
        />
        <Barras
          titulo="Por Negócio"
          icone={Briefcase}
          dica="Em qual área da operação as ocorrências aconteceram (armazenagem, expedição, movimentação, recebimento). Ajuda a ver onde focar."
          itens={data.porNegocio.map((n) => ({ rotulo: n.negocio, valor: n.count }))}
        />
      </div>

      {/* Por tipo */}
      <Barras
        titulo="Por Tipo de Ocorrência"
        icone={AlertTriangle}
        dica="Detalha os tipos específicos de ocorrência (ex.: derramamento, avaria de equipamento), do mais frequente para o menos frequente."
        itens={data.porTipo.map((t) => ({ rotulo: t.tipo, valor: t.count }))}
      />

      {/* Tabela */}
      <section className="reveal glass rounded-2xl p-5">
        <TituloSecao icone={FileText} texto="Ocorrências do Período" dica="Tabela com todas as ocorrências do mês, uma por linha, com data, horário, quem reportou, tipo, turno, área e classificação." />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-amyris/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Data</th>
                <th className="py-2 pr-3 font-medium">Hora</th>
                <th className="py-2 pr-3 font-medium">ID</th>
                <th className="py-2 pr-3 font-medium">Reportado por</th>
                <th className="py-2 pr-3 font-medium">Tipo</th>
                <th className="py-2 pr-3 font-medium">Turno</th>
                <th className="py-2 pr-3 font-medium">Negócio</th>
                <th className="py-2 pr-3 font-medium">Classificação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amyris/5">
              {data.recentes.map((o) => (
                <tr key={o.id} className="text-foreground/90">
                  <td className="py-2.5 pr-3">{dataBR(o.data)}</td>
                  <td className="py-2.5 pr-3">{o.hora}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground">{o.id}</td>
                  <td className="py-2.5 pr-3 font-medium">{o.colaborador}</td>
                  <td className="py-2.5 pr-3"><Pill texto={o.tipo} /></td>
                  <td className="py-2.5 pr-3">{o.turno}</td>
                  <td className="py-2.5 pr-3">{o.negocio}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{o.gps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Kpi({
  icone: Icone,
  rotulo,
  valor,
  detalhe,
  variacao,
  dica,
}: {
  icone: React.ComponentType<{ className?: string }>
  rotulo: string
  valor: string | number
  detalhe: string
  variacao?: number | null
  dica?: string
}) {
  const temVar = variacao !== undefined && variacao !== null
  const subiu = temVar && (variacao as number) > 0
  return (
    <div className="reveal glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
            {dica && <InfoDica titulo={rotulo} texto={dica} />}
          </div>
          <p className="mt-2 font-display text-3xl font-semibold text-amyris">{valor}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{detalhe}</p>
          {temVar && (
            <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${subiu ? "text-red-500" : "text-emerald-600"}`}>
              {subiu ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(variacao as number)}%
            </p>
          )}
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amyris-mist text-amyris">
          <Icone className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

function Calendario({ dias }: { dias: { dia: number; count: number }[] }) {
  const max = Math.max(1, ...dias.map((d) => d.count))
  // Primeiro dia da grade — para exemplo, começa numa quinta (offset 4).
  const offset = 4
  const nivel = (c: number) => {
    if (c === 0) return "bg-amyris-mist/40"
    const r = c / max
    if (r <= 0.25) return "bg-amyris/15"
    if (r <= 0.5) return "bg-amyris/30"
    if (r <= 0.75) return "bg-amyris/55 text-white"
    return "bg-amyris-grad text-white"
  }
  return (
    <div className="mt-3 flex flex-1 flex-col">
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-medium uppercase text-muted-foreground/70">
        {DIAS_SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1.5 grid flex-1 grid-cols-7 gap-1.5">
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`e${i}`} />
        ))}
        {dias.map((d) => (
          <div
            key={d.dia}
            title={`${d.count} ocorrência(s)`}
            className={`flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${nivel(d.count)}`}
          >
            {d.dia}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        Menos
        <span className="h-3 w-3 rounded bg-amyris-mist/40" />
        <span className="h-3 w-3 rounded bg-amyris/15" />
        <span className="h-3 w-3 rounded bg-amyris/30" />
        <span className="h-3 w-3 rounded bg-amyris/55" />
        <span className="h-3 w-3 rounded bg-amyris-grad" />
        Mais
      </div>
    </div>
  )
}

function TituloSecao({
  icone: Icone,
  texto,
  dica,
}: {
  icone: React.ComponentType<{ className?: string }>
  texto: string
  dica: string
}) {
  return (
    <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
      <Icone className="h-4 w-4 text-amyris" /> {texto}
      <span className="ml-auto"><InfoDica titulo={texto} texto={dica} /></span>
    </h2>
  )
}

function Barras({
  titulo,
  icone: Icone,
  itens,
  dica,
}: {
  titulo: string
  icone: React.ComponentType<{ className?: string }>
  itens: { rotulo: string; valor: number }[]
  dica?: string
}) {
  const max = Math.max(1, ...itens.map((i) => i.valor))
  return (
    <section className="reveal delay-1 glass flex flex-col rounded-2xl p-5">
      {dica ? (
        <TituloSecao icone={Icone} texto={titulo} dica={dica} />
      ) : (
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Icone className="h-4 w-4 text-amyris" /> {titulo}
        </h2>
      )}
      {itens.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Sem dados no mês.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {itens.map((i, idx) => (
            <li key={idx}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/80">{i.rotulo}</span>
                <span className="font-semibold text-foreground">{i.valor}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-amyris-mist">
                <div className="h-full rounded-full bg-amyris-grad" style={{ width: `${(i.valor / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Pill({ texto }: { texto: string }) {
  return (
    <span className="rounded-full bg-amyris-mist px-2.5 py-0.5 text-[11px] font-medium text-amyris">{texto}</span>
  )
}
