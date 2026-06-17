"use client"

import { PieChart as PieChartIcon, BarChart3, TrendingUp } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LabelList,
} from "recharts"

/* ── Types ──────────────────────────────────────────────────── */
export type DonutSlice  = { name: string; value: number; color: string }
export type SectorBar   = { name: string; count: number; color: string }
export type TrendPoint  = { month: string; validated: number; pending: number }

/* ── Custom tooltips ────────────────────────────────────────── */
function DonutTooltip({ active, payload, unit }: { active?: boolean; payload?: { name: string; value: number }[]; unit: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-0.5">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} {unit}</p>
    </div>
  )
}

function BarTooltip({ active, payload }: { active?: boolean; payload?: { payload: SectorBar }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-0.5">{d.name}</p>
      <p className="text-muted-foreground">{d.count} soumissions</p>
    </div>
  )
}

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-xs space-y-0.5">
      <p className="font-semibold text-foreground mb-0.5">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-muted-foreground">
          {p.dataKey === "validated" ? "Validées" : "En attente"} : {p.value}
        </p>
      ))}
    </div>
  )
}

/* ── Donut chart : taille des entreprises ──────────────────────── */
export function CompanySizeDonut({
  data,
  total,
}: {
  data: DonutSlice[]
  total: number
}) {
  return (
    <section className="rounded-card border border-border bg-card shadow-subtle p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <PieChartIcon className="size-4 text-muted-foreground" />
          Taille des entreprises
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">{total} total</span>
      </div>

      {/* Chart + center overlay */}
      <div className="relative mx-auto" style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              isAnimationActive
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="white" strokeWidth={3} />
              ))}
            </Pie>
            <ReTooltip content={<DonutTooltip unit="entreprises" />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] font-bold tabular-nums text-foreground leading-none">
            {total}
          </span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            entreprises
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {data.map(({ name, value, color }) => {
          const pct = total > 0 ? Math.round((value / total) * 100) : 0
          return (
            <div key={name} className="flex items-center gap-2.5">
              <div className="size-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-xs text-muted-foreground flex-1 truncate">{name}</span>
              <div className="h-1 w-16 rounded-full bg-muted overflow-hidden hidden sm:block">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums text-foreground w-5 text-right">
                {value}
              </span>
              <span className="text-[10px] text-muted-foreground/60 w-7 text-right tabular-nums">
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ── Tendance des soumissions (6 mois) ─────────────────────────── */
export function SubmissionTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <section className="rounded-card border border-border bg-card shadow-subtle p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground" />
          Tendance des soumissions
        </h2>
        <span className="text-xs text-muted-foreground">6 derniers mois</span>
      </div>

      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <ReTooltip content={<TrendTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
            <Bar dataKey="validated" stackId="s" fill="#16A34A" radius={[0, 0, 0, 0]} isAnimationActive />
            <Bar dataKey="pending" stackId="s" fill="#F59E0B" radius={[3, 3, 0, 0]} isAnimationActive />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="size-2.5 rounded-sm bg-status-ok" />
          Validées
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="size-2.5 rounded-sm bg-status-warn" />
          En attente
        </div>
      </div>
    </section>
  )
}

/* ── Horizontal bar chart ───────────────────────────────────── */
export function SectorBarChart({ data }: { data: SectorBar[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const max   = data[0]?.count ?? 1

  return (
    <section className="rounded-card border border-border bg-card shadow-subtle p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          Soumissions par secteur
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">{total} total</span>
      </div>

      {/* Recharts horizontal bar */}
      <div style={{ height: 200 }} className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 44, top: 0, bottom: 0 }}
          >
            <XAxis type="number" domain={[0, max + 2]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={76}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <ReTooltip
              content={<BarTooltip />}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22} isAnimationActive>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.88} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                style={{ fontSize: 12, fontWeight: 700, fill: "currentColor" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sector chips */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {data.map(({ name, count, color }) => (
          <div
            key={name}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: color + "18", color }}
          >
            <div className="size-1.5 rounded-full" style={{ background: color }} />
            {name} — {Math.round((count / total) * 100)}%
          </div>
        ))}
      </div>
    </section>
  )
}
