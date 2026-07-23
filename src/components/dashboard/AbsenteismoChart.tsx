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

import type { PresencasTimeline as Dados } from "@/lib/headcount"

type TooltipProps = {
  active?: boolean
  label?: string | number
  payload?: { dataKey?: string | number; value?: number }[]
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const v = payload.find((p) => p.dataKey === "absenteismo")?.value ?? 0
  return (
    <div className="rounded-xl border border-amyris/10 bg-white/90 px-3 py-2 text-xs shadow-[0_12px_32px_-16px_rgba(75,0,133,0.4)] backdrop-blur-xl">
      <p className="mb-1.5 font-semibold text-foreground">Dia {label}</p>
      <p className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amyris" />
        Absenteísmo
        <span className="ml-3 font-semibold tabular-nums text-foreground">{v}%</span>
      </p>
    </div>
  )
}

/** Absenteísmo (% de faltas sobre os escalados) por dia do mês. */
export function AbsenteismoChart({ dados }: { dados: Dados }) {
  const pontos = dados.pontos.filter((p) => !p.domingo) // domingo não tem operação
  const maxAbs = Math.max(10, ...pontos.map((p) => p.absenteismo))
  const topo = Math.ceil((maxAbs + 5) / 10) * 10

  return (
    <div role="img" aria-label="Gráfico do percentual de absenteísmo por dia ao longo do mês.">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={pontos} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fillAbsGeral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4B0085" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4B0085" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#EDE7F6" vertical={false} />
          <XAxis
            dataKey="dia"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={14}
            tick={{ fontSize: 11, fill: "#7A7A7A" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={38}
            domain={[0, topo]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 11, fill: "#7A7A7A" }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "#4B0085", strokeOpacity: 0.18, strokeWidth: 1.5 }}
          />
          <Area
            type="monotone"
            dataKey="absenteismo"
            name="absenteismo"
            stroke="#4B0085"
            strokeWidth={3}
            fill="url(#fillAbsGeral)"
            dot={{ r: 2.5, fill: "#4B0085", stroke: "#fff", strokeWidth: 1 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            animationDuration={1100}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
