"use client"

import { useState, useMemo, useEffect } from "react"
import {
  ExternalLink,
  XCircle,
  Archive,
  Download,
  CalendarClock,
  Send,
  ArrowUpDown,
  SearchX,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"

/* ── Types ──────────────────────────────────────────────────── */
export type CampaignTarget = { id: string; status: string }

export type Campaign = {
  id: string
  title: string
  reference_period: string
  periodicity: string
  closes_at: string
  sector: { name: string } | null
  targets: CampaignTarget[]
}

/* ── Static config ──────────────────────────────────────────── */
const PERIODICITY_LABELS: Record<string, string> = {
  monthly:   "Mensuel",
  quarterly: "Trimestriel",
  annual:    "Annuel",
  one_off:   "Ponctuel",
}

const TARGET_STATUS_CONFIG = [
  { key: "validated",   label: "Validées",   color: "var(--status-ok)",     dotClass: "bg-status-ok"     },
  { key: "submitted",   label: "Soumises",   color: "var(--status-info)",   dotClass: "bg-status-info"   },
  { key: "in_progress", label: "En cours",   color: "var(--status-purple)", dotClass: "bg-status-purple" },
  { key: "waiting",     label: "En attente", color: "var(--status-gray)",   dotClass: "bg-status-gray"   },
  { key: "rejected",    label: "Rejetées",   color: "var(--status-bad)",    dotClass: "bg-status-bad"    },
] as const

const SECTOR_ACCENT: Record<string, { badgeBg: string; badgeText: string; strip: string }> = {
  "Mines":     { badgeBg: "bg-amber-100",  badgeText: "text-amber-800",  strip: "bg-amber-500"  },
  "Finances":  { badgeBg: "bg-blue-100",   badgeText: "text-blue-800",   strip: "bg-blue-500"   },
  "Commerce":  { badgeBg: "bg-orange-100", badgeText: "text-orange-800", strip: "bg-orange-500" },
  "Industrie": { badgeBg: "bg-violet-100", badgeText: "text-violet-800", strip: "bg-violet-500" },
  "Energie":   { badgeBg: "bg-green-100",  badgeText: "text-green-800",  strip: "bg-green-500"  },
}
const DEFAULT_ACCENT = {
  badgeBg: "bg-muted", badgeText: "text-muted-foreground", strip: "bg-muted-foreground/40",
}

type SortKey = "closes_at" | "rate"
type SortDir = "asc" | "desc"

/* ── Helpers ────────────────────────────────────────────────── */
function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  })
}

function getRate(c: Campaign): number {
  const t = c.targets.length
  if (t === 0) return 0
  return c.targets.filter((tt) => tt.status === "submitted" || tt.status === "validated").length / t
}

/* ── Sub-components ─────────────────────────────────────────── */
function DeadlinePill({ days }: { days: number }) {
  if (days < 0)
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
        Expirée
      </span>
    )
  if (days <= 3)
    return (
      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-status-bad-bg text-status-bad-text ring-1 ring-status-bad/20">
        J‑{days}
      </span>
    )
  if (days <= 7)
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-status-warn-bg text-status-warn-text">
        J‑{days}
      </span>
    )
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
      J‑{days}
    </span>
  )
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  )
}

function CircleProgress({ pct }: { pct: number }) {
  const size    = 88
  const strokeW = 7
  const r       = (size - strokeW) / 2
  const c       = 2 * Math.PI * r
  const offset  = c - (pct / 100) * c
  const color   = pct >= 80 ? "var(--status-ok)" : pct >= 50 ? "var(--status-info)" : "var(--status-warn)"

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--border)" strokeWidth={strokeW}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={strokeW}
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-lg font-bold tabular-nums leading-none" style={{ color }}>
          {pct}%
        </span>
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider leading-none">
          réponse
        </span>
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────── */
export function CampaignSidepanel({ campaigns }: { campaigns: Campaign[] }) {
  const [selected, setSelected] = useState<Campaign>(campaigns[0])
  const [search, setSearch]     = useState("")
  const [searchKey, setSearchKey] = useState(0)
  const [sectorFilter, setSectorFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo]     = useState("")
  const [sortKey, setSortKey]   = useState<SortKey>("closes_at")
  const [sortDir, setSortDir]   = useState<SortDir>("asc")

  if (campaigns.length === 0) return null

  /* Unique sectors available */
  const sectorNames = useMemo(
    () => [...new Set(campaigns.map((c) => c.sector?.name).filter(Boolean) as string[])].sort(),
    [campaigns],
  )

  /* Filtered + sorted list */
  const visible = useMemo(() => {
    const q    = search.toLowerCase()
    const from = dateFrom ? new Date(dateFrom).getTime() : null
    const to   = dateTo   ? new Date(dateTo + "T23:59:59").getTime() : null
    let result = campaigns.filter((c) => {
      if (q && !c.title.toLowerCase().includes(q)) return false
      if (sectorFilter && c.sector?.name !== sectorFilter) return false
      const closesAt = new Date(c.closes_at).getTime()
      if (from && closesAt < from) return false
      if (to   && closesAt > to)   return false
      return true
    })
    result = [...result].sort((a, b) => {
      if (sortKey === "closes_at") {
        const diff = new Date(a.closes_at).getTime() - new Date(b.closes_at).getTime()
        return sortDir === "asc" ? diff : -diff
      }
      const diff = getRate(a) - getRate(b)
      return sortDir === "asc" ? diff : -diff
    })
    return result
  }, [campaigns, search, sectorFilter, sortKey, sortDir])

  /* Auto-select first visible when current selection is filtered out */
  useEffect(() => {
    if (visible.length > 0 && !visible.find((c) => c.id === selected.id)) {
      setSelected(visible[0])
    }
  }, [visible, selected.id])

  function resetFilters() {
    setSearch("")
    setSearchKey((k) => k + 1)
    setSectorFilter("")
    setDateFrom("")
    setDateTo("")
    setSortKey("closes_at")
    setSortDir("asc")
  }

  /* Detail stats */
  const total     = selected.targets.length
  const responded = selected.targets.filter(
    (t) => t.status === "submitted" || t.status === "validated",
  ).length
  const validated = selected.targets.filter((t) => t.status === "validated").length
  const rate      = total > 0 ? Math.round((responded / total) * 100) : 0
  const validRate = total > 0 ? Math.round((validated  / total) * 100) : 0
  const days      = daysUntil(selected.closes_at)

  const statusCounts = Object.fromEntries(
    TARGET_STATUS_CONFIG.map((cfg) => [
      cfg.key,
      selected.targets.filter((t) => t.status === cfg.key).length,
    ]),
  )

  const selectedAccent = SECTOR_ACCENT[selected.sector?.name ?? ""] ?? DEFAULT_ACCENT

  return (
    <div className="rounded-card border-2 border-border bg-card shadow-medium overflow-hidden flex h-[500px]">

      {/* ── Left: campaign list ───────────────── */}
      <div className="w-80 shrink-0 border-r-2 border-border flex flex-col bg-surface-2">

        {/* Toolbar */}
        <div className="border-b border-border bg-muted px-2 py-2 space-y-2">
          {/* Search + sort row */}
          <div className="flex items-center gap-1.5">
            <SearchInput
              key={searchKey}
              onChange={setSearch}
              placeholder="Rechercher…"
              className="flex-1"
              debounce={150}
            />
            {/* Sort select */}
            <div className="relative shrink-0">
              <select
                value={`${sortKey}:${sortDir}`}
                onChange={(e) => {
                  const [k, d] = e.target.value.split(":")
                  setSortKey(k as SortKey)
                  setSortDir(d as SortDir)
                }}
                title="Trier par"
                className={cn(
                  "h-8 w-8 appearance-none rounded-control border border-input bg-background",
                  "text-[0px] outline-none cursor-pointer transition-colors",
                  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
                  (sortKey !== "closes_at" || sortDir !== "asc") && "border-primary/60 bg-primary/5",
                )}
              >
                <option value="closes_at:asc">Clôture (proche)</option>
                <option value="closes_at:desc">Clôture (lointaine)</option>
                <option value="rate:desc">Taux de réponse ↓</option>
                <option value="rate:asc">Taux de réponse ↑</option>
              </select>
              <ArrowUpDown
                className={cn(
                  "pointer-events-none absolute inset-0 m-auto size-3.5",
                  (sortKey !== "closes_at" || sortDir !== "asc")
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              />
            </div>
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-1.5">
            <CalendarClock className="size-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground shrink-0">Clôture</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="Date de clôture — début"
              className={cn(
                "h-7 flex-1 min-w-0 rounded-control border bg-background px-1.5 text-xs outline-none cursor-pointer transition-colors",
                "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
                "[&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:cursor-pointer",
                dateFrom ? "border-primary/60 bg-primary/5 text-primary" : "border-input text-muted-foreground",
              )}
            />
            <span className="text-xs text-muted-foreground">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="Date de clôture — fin"
              className={cn(
                "h-7 flex-1 min-w-0 rounded-control border bg-background px-1.5 text-xs outline-none cursor-pointer transition-colors",
                "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
                "[&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:cursor-pointer",
                dateTo ? "border-primary/60 bg-primary/5 text-primary" : "border-input text-muted-foreground",
              )}
            />
          </div>

          {/* Sector filter chips */}
          {sectorNames.length > 1 && (
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSectorFilter("")}
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium border transition-colors",
                  sectorFilter === ""
                    ? "bg-foreground text-background border-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border-strong",
                )}
              >
                Tous
              </button>
              {sectorNames.map((name) => {
                const acc = SECTOR_ACCENT[name] ?? DEFAULT_ACCENT
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSectorFilter(sectorFilter === name ? "" : name)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium border transition-colors",
                      sectorFilter === name
                        ? cn(acc.badgeBg, acc.badgeText, "border-transparent")
                        : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border-strong",
                    )}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Count row */}
        <div className="px-3 py-2 border-b border-border/60">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {visible.length} / {campaigns.length} campagne{campaigns.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <SearchX className="size-6 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Aucune campagne</p>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-primary hover:underline"
              >
                Réinitialiser
              </button>
            </div>
          ) : (
            visible.map((c) => {
              const t  = c.targets.length
              const rr = c.targets.filter(
                (tt) => tt.status === "submitted" || tt.status === "validated",
              ).length
              const rt       = t > 0 ? Math.round((rr / t) * 100) : 0
              const d        = daysUntil(c.closes_at)
              const isSelected = selected.id === c.id
              const barColor = rt >= 80 ? "var(--status-ok)" : rt >= 50 ? "var(--status-info)" : "var(--status-warn)"
              const accent   = SECTOR_ACCENT[c.sector?.name ?? ""] ?? DEFAULT_ACCENT

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c)}
                  className={cn(
                    "w-full text-left rounded-lg overflow-hidden transition-all border-2",
                    isSelected
                      ? "border-primary/40 bg-card shadow-[0_2px_8px_0_rgb(37,99,235,0.12)] ring-0"
                      : "border-border bg-card/60 hover:bg-card hover:border-border-strong hover:shadow-sm",
                  )}
                >
                  <div className="flex min-h-0">
                    <div className={cn("w-1 shrink-0", accent.strip)} />
                    <div className="flex-1 px-2.5 py-2.5">
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className={cn(
                          "text-xs font-semibold px-1.5 py-0.5 rounded truncate max-w-[7rem]",
                          accent.badgeBg, accent.badgeText,
                        )}>
                          {c.sector?.name ?? "—"}
                        </span>
                        <DeadlinePill days={d} />
                      </div>
                      <p className={cn(
                        "text-xs leading-snug line-clamp-2 mb-2",
                        isSelected ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
                      )}>
                        {c.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <MiniBar value={rt} color={barColor} />
                        <span className="text-xs tabular-nums text-muted-foreground/70 shrink-0 font-medium">
                          {rr}/{t}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Right: detail ────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Detail header */}
        <div className="px-5 pt-4 pb-3 border-b-2 border-border bg-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  selectedAccent.badgeBg, selectedAccent.badgeText,
                )}>
                  {selected.sector?.name ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {PERIODICITY_LABELS[selected.periodicity] ?? selected.periodicity}
                </span>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {selected.reference_period}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground leading-snug">
                {selected.title}
              </h3>
            </div>
            <Link
              href={`/direction/campagnes/${selected.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 gap-1.5")}
            >
              Ouvrir
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>

        {/* Detail body */}
        <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto">

          {/* Progress + mini KPIs */}
          <div className="flex items-center gap-5">
            <CircleProgress pct={rate} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-0.5">
                {responded} / {total} entreprises
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                ont soumis ou validé leurs données
              </p>
              <div className="flex gap-4 flex-wrap">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    Validées
                  </span>
                  <span className="text-sm font-bold text-status-ok-text tabular-nums">
                    {validated}{" "}
                    <span className="text-xs font-medium text-muted-foreground/60">({validRate}%)</span>
                  </span>
                </div>
                <div className="w-px bg-border self-stretch" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    En attente
                  </span>
                  <span className="text-sm font-bold text-muted-foreground tabular-nums">
                    {total - responded}{" "}
                    <span className="text-xs font-medium text-muted-foreground/60">({100 - rate}%)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status breakdown */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
              Répartition par statut
            </p>
            <div className="space-y-2">
              {TARGET_STATUS_CONFIG.map(({ key, label, color, dotClass }) => {
                const count = statusCounts[key] ?? 0
                if (count === 0) return null
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={key} className="flex items-center gap-2.5">
                    <div className={cn("size-2 rounded-full shrink-0", dotClass)} />
                    <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
                    <MiniBar value={pct} color={color} />
                    <span className="text-xs tabular-nums font-semibold text-foreground w-4 text-right shrink-0">
                      {count}
                    </span>
                    <span className="text-xs text-muted-foreground/60 w-7 text-right shrink-0">
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-2">
            <CalendarClock className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Clôture le</span>
            <span className={cn(
              "text-xs font-semibold",
              days <= 7 && days >= 0 ? "text-status-bad-text" : "text-foreground",
            )}>
              {formatFullDate(selected.closes_at)}
            </span>
            <DeadlinePill days={days} />
          </div>
        </div>

        {/* Action footer */}
        <div className="px-5 py-3 border-t-2 border-border bg-surface-2 flex flex-wrap gap-2">
          <button type="button" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
            <Send className="size-3.5" />
            Envoyer une relance
          </button>
          <button type="button" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
            <Download className="size-3.5" />
            Exporter
          </button>
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 border-status-warn/40 bg-status-warn-bg text-status-warn-text hover:bg-status-warn-bg/80",
            )}
          >
            <Archive className="size-3.5" />
            Suspendre
          </button>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "destructive", size: "sm" }), "gap-1.5")}
          >
            <XCircle className="size-3.5" />
            Clôturer
          </button>
        </div>
      </div>
    </div>
  )
}
