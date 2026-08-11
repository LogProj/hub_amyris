"use client"

import { useState } from "react"
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
import { Clock, Activity, Tag, Target, Users, Briefcase, type LucideIcon } from "lucide-react"

import { InfoDica } from "@/components/dashboard/InfoDica"

type Item = { rotulo: string; valor: number }
type Lado = { label: string; icon: string; data: Item[] }

const ICONES: Record<string, LucideIcon> = { Clock, Activity, Tag, Target, Users, Briefcase }

// Paleta Amyris (roxo) — substitui o indigo do LogFy.
const AMYRIS = "#4B0085"
const PALETA = ["#4B0085", "#7C3AED", "#A855F7", "#C084FC", "#6D28D9", "#8B5CF6", "#C4B5FD", "#5B21B6"]

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

function Toggle({ lados, ativo, setAtivo }: { lados: [Lado, Lado]; ativo: 0 | 1; setAtivo: (v: 0 | 1) => void }) {
  return (
    <div className="ml-auto inline-flex rounded-lg bg-amyris-mist/60 p-0.5">
      {lados.map((l, i) => {
        const Icone = ICONES[l.icon] ?? Tag
        const on = ativo === i
        return (
          <button
            key={i}
            type="button"
            onClick={() => setAtivo(i as 0 | 1)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              on ? "bg-white text-amyris shadow-sm" : "text-muted-foreground hover:text-amyris"
            }`}
          >
            <Icone className="h-3.5 w-3.5" /> {l.label}
          </button>
        )
      })}
    </div>
  )
}

/** Ocorrências por mês (barras verticais) — "Ocorrências por Mês" do LogFy. */
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

/** Rosca com alternância entre dois indicadores (ex.: Turno ↔ PSIF). */
export function ToggleDonut({ ladoA, ladoB, dica }: { ladoA: Lado; ladoB: Lado; dica?: string }) {
  const [ativo, setAtivo] = useState<0 | 1>(0)
  const lado = ativo === 0 ? ladoA : ladoB
  const data = lado.data
  const total = data.reduce((s, d) => s + d.valor, 0)
  return (
    <section className="reveal glass flex flex-col rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold">Por {lado.label}</h2>
        {dica && <InfoDica titulo={`Por ${lado.label}`} texto={dica} />}
        <Toggle lados={[ladoA, ladoB]} ativo={ativo} setAtivo={setAtivo} />
      </div>
      <div className="mt-4 flex flex-col items-center" role="img" aria-label={`Ocorrências por ${lado.label}`}>
        {total === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Sem dados no mês.</p>
        ) : (
          <>
            <div className="relative h-[210px] w-full">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={data} dataKey="valor" nameKey="rotulo" innerRadius={60} outerRadius={88} stroke="none" paddingAngle={2}>
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
            <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
              {data.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PALETA[i % PALETA.length] }} /> {d.rotulo} ({d.valor})
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

/** Barras horizontais com alternância entre dois indicadores. */
export function ToggleBarras({ ladoA, ladoB, dica }: { ladoA: Lado; ladoB: Lado; dica?: string }) {
  const [ativo, setAtivo] = useState<0 | 1>(0)
  const lado = ativo === 0 ? ladoA : ladoB
  const data = [...lado.data].slice(0, 5)
  const max = Math.max(1, ...data.map((d) => d.valor))
  return (
    <section className="reveal glass flex flex-col rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold">{lado.label}</h2>
        {dica && <InfoDica titulo={lado.label} texto={dica} />}
        <Toggle lados={[ladoA, ladoB]} ativo={ativo} setAtivo={setAtivo} />
      </div>
      {data.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Sem dados no mês.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {data.map((i, idx) => (
            <li key={idx}>
              <div className="flex items-center justify-between text-sm">
                <span className="truncate pr-2 text-foreground/80">{i.rotulo}</span>
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
