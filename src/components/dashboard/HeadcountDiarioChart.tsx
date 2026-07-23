"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { PontoHeadcountDiario } from "@/lib/turnover"

type TooltipProps = {
  active?: boolean
  label?: string | number
  payload?: { payload?: PontoHeadcountDiario }[]
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const ponto = payload[0]?.payload
  if (!ponto) return null
  return (
    <div className="rounded-xl border border-amyris/10 bg-white/90 px-3 py-2 text-xs shadow-[0_12px_32px_-16px_rgba(75,0,133,0.4)] backdrop-blur-xl">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      <p className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amyris" />
        Ativos
        <span className="ml-3 font-semibold tabular-nums text-foreground">{ponto.ativos}</span>
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {ponto.congelado ? "Snapshot congelado do dia" : "Reconstruído (sem snapshot congelado)"}
      </p>
    </div>
  )
}

/** Headcount de ativos por dia do mês selecionado (congelado quando disponível, reconstruído como fallback). */
export function HeadcountDiarioChart({ dados }: { dados: PontoHeadcountDiario[] }) {
  const maxAtivos = Math.max(1, ...dados.map((p) => p.ativos))
  const topo = Math.ceil((maxAtivos + 1) / 5) * 5

  return (
    <div role="img" aria-label="Gráfico de área do headcount de colaboradores ativos por dia do mês.">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={dados} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fillHeadcountDiario" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4B0085" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4B0085" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#EDE7F6" vertical={false} />
          <XAxis dataKey="dia" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7A7A7A" }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={32}
            domain={[0, topo]}
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#7A7A7A" }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#4B0085", strokeOpacity: 0.18, strokeWidth: 1.5 }} />
          <Area
            type="monotone"
            dataKey="ativos"
            name="ativos"
            stroke="#4B0085"
            strokeWidth={3}
            fill="url(#fillHeadcountDiario)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            animationDuration={1100}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
