"use client"

import {
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts"

// Paleta Amyris (roxo) — substitui o indigo do LogFy.
const AMYRIS = "#4B0085"
const PALETA = ["#4B0085", "#7C3AED", "#A855F7", "#C084FC", "#6D28D9", "#8B5CF6"]

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

/** Ocorrências por mês (barras verticais) — igual ao "Ocorrências por Mês" do LogFy. */
export function MesBarChart({ data }: { data: { mes: string; count: number }[] }) {
  return (
    <div role="img" aria-label="Ocorrências por mês">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EDE7F6" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#7A7A7A" }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#7A7A7A" }} tickLine={false} axisLine={false} width={28} />
          <Tooltip
            cursor={{ fill: "#F3EEFA" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <Caixa titulo={String(payload[0].payload.mes)} linhas={[`${payload[0].payload.count} ocorrências`]} />
              ) : null
            }
          />
          <Bar dataKey="count" fill={AMYRIS} radius={[6, 6, 0, 0]} barSize={26}>
            <LabelList dataKey="count" position="top" fontSize={11} fill="#5A5A5A" formatter={(v) => (Number(v) > 0 ? String(v) : "")} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Rosca por turno — Amyris. */
export function TurnoDonut({ data }: { data: { turno: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <div className="flex flex-col items-center" role="img" aria-label="Ocorrências por turno">
      <div className="relative h-[220px] w-full">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="turno" innerRadius={64} outerRadius={92} stroke="none" paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={PALETA[i % PALETA.length]} />
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
          <span className="font-display text-3xl font-semibold text-amyris-ink">{total}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">no mês</span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm">
        {data.map((d, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PALETA[i % PALETA.length] }} /> {d.turno} ({d.count})
          </span>
        ))}
      </div>
    </div>
  )
}
