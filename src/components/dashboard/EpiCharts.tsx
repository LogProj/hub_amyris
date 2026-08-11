"use client"

import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const ROXO = "#4B0085"
const VERDE = "#16a34a"
const VERMELHO = "#dc2626"

function Caixa({ titulo, linhas }: { titulo: string; linhas: string[] }) {
  return (
    <div className="rounded-xl border border-amyris/10 bg-white/90 px-3 py-2 shadow-[0_10px_30px_-12px_rgba(75,0,133,0.35)] backdrop-blur-xl">
      <p className="text-xs font-medium text-amyris-ink">{titulo}</p>
      {linhas.map((l, i) => (
        <p key={i} className="text-xs text-muted-foreground">{l}</p>
      ))}
    </div>
  )
}

export function EpiAderenciaChart({ data }: { data: { dia: string; aderencia: number }[] }) {
  return (
    <div role="img" aria-label="Aderência de EPI por dia">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="epiAder" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ROXO} stopOpacity={0.35} />
              <stop offset="100%" stopColor={ROXO} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EDE7F6" vertical={false} />
          <XAxis dataKey="dia" tickFormatter={(d) => String(d).slice(8)} tick={{ fontSize: 11, fill: "#7A7A7A" }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#7A7A7A" }} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <Caixa titulo={`Dia ${String(payload[0].payload.dia).slice(8)}`} linhas={[`Aderência: ${payload[0].payload.aderencia}%`]} />
              ) : null
            }
          />
          <Area type="monotone" dataKey="aderencia" stroke={ROXO} strokeWidth={2} fill="url(#epiAder)" dot={{ r: 3, fill: ROXO }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function EpiConformidadeChart({ conformes, naoConformes }: { conformes: number; naoConformes: number }) {
  const total = conformes + naoConformes
  const data = [
    { nome: "Conforme", valor: conformes, cor: VERDE },
    { nome: "Não conforme", valor: naoConformes, cor: VERMELHO },
  ]
  const pct = total > 0 ? Math.round((conformes / total) * 100) : 0
  return (
    <div className="flex flex-col items-center" role="img" aria-label="Conformidade dos preenchimentos">
      <div className="relative h-[220px] w-full">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="valor" nameKey="nome" innerRadius={64} outerRadius={92} stroke="none" paddingAngle={2}>
              {data.map((d) => (
                <Cell key={d.nome} fill={d.cor} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <Caixa titulo={String(payload[0].name)} linhas={[`${payload[0].value} (${total > 0 ? Math.round((Number(payload[0].value) / total) * 100) : 0}%)`]} />
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-semibold" style={{ color: VERDE }}>{pct}%</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">conforme</span>
        </div>
      </div>
      <div className="mt-2 flex gap-4 text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: VERDE }} /> Conforme ({conformes})
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: VERMELHO }} /> Não conforme ({naoConformes})
        </span>
      </div>
    </div>
  )
}
