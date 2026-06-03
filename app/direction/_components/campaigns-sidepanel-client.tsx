"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import {
  Search, Megaphone, Clock, CalendarDays, Users,
  CheckCircle2, CircleDot, Circle, ArrowUpRight,
  Play, Ban, ArchiveIcon, ChevronRight, X, Send,
} from "lucide-react"
import Link from "next/link"
import { updateCampaignStatus } from "@/app/actions/campaigns"
import { cn } from "@/lib/utils"

/* ── Types ──────────────────────────────────────────────────────── */
export type CampaignStatus = "draft" | "scheduled" | "active" | "closed" | "archived"

export type CampaignItem = {
  id: string
  title: string
  sector: { name: string; code: string }
  periodicity: string
  reference_period: string
  status: CampaignStatus
  opens_at: string | null
  closes_at: string | null
  target_mode: string
  targets: { total: number; validated: number; submitted: number }
}

/* ── Display config ─────────────────────────────────────────────── */
const STATUS_CFG: Record<CampaignStatus, {
  label: string
  dot: string
  strip: string
  badge: string
}> = {
  draft:     { label: "Brouillon", dot: "bg-gray-300",    strip: "bg-gray-200",    badge: "bg-gray-50   text-gray-500   border-gray-200"    },
  scheduled: { label: "Planifiée", dot: "bg-blue-400",    strip: "bg-blue-400",    badge: "bg-blue-50   text-blue-700   border-blue-200"    },
  active:    { label: "Active",    dot: "bg-emerald-500", strip: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed:    { label: "Clôturée", dot: "bg-slate-300",   strip: "bg-slate-300",   badge: "bg-slate-50  text-slate-600  border-slate-200"   },
  archived:  { label: "Archivée", dot: "bg-gray-200",    strip: "bg-gray-100",    badge: "bg-gray-50   text-gray-400   border-gray-100"    },
}

const SECTOR_COLOR: Record<string, string> = {
  MINES:     "bg-amber-500   text-white",
  ENERGIE:   "bg-emerald-600 text-white",
  FINANCE:   "bg-blue-600    text-white",
  COMMERCE:  "bg-orange-500  text-white",
  INDUSTRIE: "bg-violet-500  text-white",
}

const PERIODICITY: Record<string, string> = {
  monthly: "Mensuel", quarterly: "Trimestriel", annual: "Annuel", one_off: "Ponctuel",
}

const TARGET_MODE: Record<string, string> = {
  sector: "Secteur entier", specific: "Sélection manuelle",
}

/* ── Helpers ────────────────────────────────────────────────────── */
function daysUntil(s: string) {
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86_400_000)
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
}

function progressColor(rate: number) {
  if (rate >= 80) return { bar: "#22c55e", text: "text-emerald-600" }
  if (rate >= 50) return { bar: "#3b82f6", text: "text-blue-600"    }
  return               { bar: "#f59e0b", text: "text-amber-600"   }
}

/* ── Campaign list item ─────────────────────────────────────────── */
function CampaignListItem({
  c,
  isSelected,
  onSelect,
}: {
  c: CampaignItem
  isSelected: boolean
  onSelect: () => void
}) {
  const cfg      = STATUS_CFG[c.status]
  const chip     = SECTOR_COLOR[c.sector.code] ?? "bg-gray-400 text-white"
  const responded = c.targets.validated + c.targets.submitted
  const rate      = c.targets.total > 0 ? Math.round((responded / c.targets.total) * 100) : 0
  const days      = c.closes_at ? daysUntil(c.closes_at) : null
  const isUrgent  = days !== null && days <= 7 && c.status === "active"
  const pColor    = progressColor(rate)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-stretch text-left transition-all duration-150 group",
        isSelected
          ? "bg-accent border-r-2 border-primary"
          : "hover:bg-muted/40 border-r-2 border-transparent",
      )}
    >
      {/* Status strip */}
      <div className={cn("w-[3px] shrink-0", cfg.strip)} />

      <div className="flex-1 px-3 py-2.5 min-w-0">
        {/* Row 1 : sector chip + deadline */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className={cn(
            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0",
            chip,
          )}>
            {c.sector.code}
          </span>

          {c.status === "active" && days !== null ? (
            <span className={cn(
              "text-[10px] font-bold tabular-nums shrink-0",
              isUrgent ? (days <= 3 ? "text-red-600" : "text-orange-500") : "text-muted-foreground/60",
            )}>
              J‑{days}
            </span>
          ) : c.status === "scheduled" && c.opens_at ? (
            <span className="text-[10px] text-blue-500 font-medium shrink-0">
              J+{Math.abs(daysUntil(c.opens_at))}
            </span>
          ) : null}
        </div>

        {/* Row 2 : title */}
        <p className={cn(
          "text-[12px] font-medium leading-tight line-clamp-2",
          isSelected ? "text-foreground" : "text-foreground/80 group-hover:text-foreground",
        )}>
          {c.title}
        </p>

        {/* Row 3 : progress bar (active/closed only) */}
        {(c.status === "active" || c.status === "closed") && c.targets.total > 0 ? (
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${rate}%`, backgroundColor: pColor.bar }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground/60 shrink-0 font-medium">
              {responded}/{c.targets.total}
            </span>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground/50 mt-1">
            {c.reference_period} · {PERIODICITY[c.periodicity] ?? c.periodicity}
          </p>
        )}
      </div>
    </button>
  )
}

/* ── Status group ───────────────────────────────────────────────── */
function StatusGroup({
  statusKey, campaigns, selectedId, onSelect,
}: {
  statusKey: CampaignStatus
  campaigns: CampaignItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  if (campaigns.length === 0) return null
  const cfg = STATUS_CFG[statusKey]

  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-2 sticky top-0 bg-card z-10 border-b border-border/40">
        <span className={cn("size-2 rounded-full shrink-0", cfg.dot)} />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {cfg.label}
        </span>
        <span className="text-[10px] text-muted-foreground/40 tabular-nums ml-auto">
          {campaigns.length}
        </span>
      </div>
      {campaigns.map((c) => (
        <CampaignListItem
          key={c.id}
          c={c}
          isSelected={c.id === selectedId}
          onSelect={() => onSelect(c.id)}
        />
      ))}
    </div>
  )
}

/* ── Campaign detail panel ──────────────────────────────────────── */
function CampaignDetail({
  c,
  onClose,
}: {
  c: CampaignItem
  onClose: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const cfg       = STATUS_CFG[c.status]
  const chip      = SECTOR_COLOR[c.sector.code] ?? "bg-gray-400 text-white"
  const responded  = c.targets.validated + c.targets.submitted
  const waiting    = c.targets.total - responded
  const rate       = c.targets.total > 0 ? Math.round((responded / c.targets.total) * 100) : 0
  const pColor     = progressColor(rate)
  const days       = c.closes_at ? daysUntil(c.closes_at) : null
  const isUrgent   = days !== null && days <= 7 && c.status === "active"

  function changeStatus(status: CampaignStatus) {
    startTransition(async () => {
      const res = await updateCampaignStatus(c.id, status)
      if ("error" in res) {
        toast.error(res.error)
      } else {
        toast.success(`Campagne ${STATUS_CFG[status].label.toLowerCase()}`)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Sticky header ──────────────────────────────────── */}
      <div
        className="shrink-0 px-6 pt-5 pb-4 border-b border-border sticky top-0 z-10 space-y-3"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}
      >
        {/* Row 1 : chips + close */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
              chip,
            )}>
              {c.sector.code}
            </span>
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
              cfg.badge,
            )}>
              <span className={cn("size-1.5 rounded-full", cfg.dot)} />
              {cfg.label}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {PERIODICITY[c.periodicity] ?? c.periodicity} · {c.reference_period}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Row 2 : title */}
        <h2 className="text-base font-semibold text-foreground leading-snug">
          {c.title}
        </h2>

        {/* Row 3 : actions */}
        <div className="flex items-end gap-2 flex-wrap">

          {/* Voir le détail — grand bouton carré */}
          <Link
            href={`/direction/campagnes/${c.id}`}
            className="inline-flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm w-16 h-16 shrink-0"
          >
            <ArrowUpRight className="size-5" />
            <span className="text-[9px] font-bold uppercase tracking-wide leading-none text-center">Détail</span>
          </Link>

          {c.status === "draft" && (
            <>
              <ActionBtn
                icon={<Play className="size-3.5" />}
                label="Planifier"
                hint="Programmer l'ouverture à une date future"
                onClick={() => changeStatus("scheduled")}
                disabled={isPending}
                variant="secondary"
              />
              <ActionBtn
                icon={<Send className="size-3.5" />}
                label="Publier"
                hint="Rendre la campagne visible aux entreprises ciblées"
                onClick={() => changeStatus("active")}
                disabled={isPending}
                variant="publish"
              />
            </>
          )}
          {c.status === "scheduled" && (
            <>
              <ActionBtn
                icon={<Ban className="size-3.5" />}
                label="Repasser en brouillon"
                onClick={() => changeStatus("draft")}
                disabled={isPending}
                variant="secondary"
              />
              <ActionBtn
                icon={<Send className="size-3.5" />}
                label="Publier maintenant"
                hint="Ouvrir immédiatement aux entreprises ciblées"
                onClick={() => changeStatus("active")}
                disabled={isPending}
                variant="publish"
              />
            </>
          )}
          {c.status === "active" && (
            <ActionBtn
              icon={<CircleDot className="size-3.5" />}
              label="Clôturer"
              hint="Fermer la collecte — les entreprises ne pourront plus soumettre"
              onClick={() => changeStatus("closed")}
              disabled={isPending}
              variant="danger"
            />
          )}
          {c.status === "closed" && (
            <ActionBtn
              icon={<ArchiveIcon className="size-3.5" />}
              label="Archiver"
              onClick={() => changeStatus("archived")}
              disabled={isPending}
              variant="secondary"
            />
          )}
        </div>
      </div>

      {/* ── Scrollable body ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ scrollbarWidth: "thin" }}>

        {/* Progress section */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-subtle space-y-3">
          <div className="flex items-end justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Progression
            </p>
            <span className={cn("text-2xl font-bold tabular-nums", c.targets.total === 0 ? "text-muted-foreground/40" : pColor.text)}>
              {c.targets.total === 0 ? "—" : `${rate} %`}
            </span>
          </div>

          {c.targets.total > 0 ? (
            <>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${rate}%`, backgroundColor: pColor.bar }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Validées</p>
                  <p className="text-lg font-bold tabular-nums text-emerald-600">{c.targets.validated}</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Soumises</p>
                  <p className="text-lg font-bold tabular-nums text-blue-600">{c.targets.submitted}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Restantes</p>
                  <p className="text-lg font-bold tabular-nums text-muted-foreground">{waiting}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic text-center py-2">
              Aucune entreprise ciblée pour le moment
            </p>
          )}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Cibles */}
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-subtle">
            <div className="flex items-center gap-2 mb-2">
              <Users className="size-3.5 text-muted-foreground/60" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cibles</p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">{c.targets.total}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {TARGET_MODE[c.target_mode] ?? c.target_mode}
            </p>
          </div>

          {/* Deadline */}
          <div className={cn(
            "rounded-xl border p-3.5 shadow-subtle",
            isUrgent ? "border-orange-200 bg-orange-50" : "border-border bg-card",
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className={cn("size-3.5", isUrgent ? "text-orange-500" : "text-muted-foreground/60")} />
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                isUrgent ? "text-orange-600" : "text-muted-foreground",
              )}>
                {c.status === "active" ? "Clôture" : "Délai"}
              </p>
            </div>
            {days !== null && c.status === "active" ? (
              <>
                <p className={cn(
                  "text-2xl font-bold tabular-nums",
                  isUrgent ? (days <= 3 ? "text-red-600" : "text-orange-500") : "text-foreground",
                )}>
                  J‑{days}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {c.closes_at ? fmtDate(c.closes_at) : "—"}
                </p>
              </>
            ) : c.closes_at ? (
              <>
                <p className="text-sm font-semibold text-foreground">{fmtDate(c.closes_at)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Date de clôture</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground/40 mt-1">Non définie</p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-subtle space-y-2.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Fenêtre temporelle
          </p>
          <div className="flex items-center gap-3 text-sm">
            <CalendarDays className="size-3.5 text-muted-foreground/50 shrink-0" />
            <span className="text-muted-foreground text-xs w-16 shrink-0">Ouverture</span>
            <span className="font-medium text-foreground text-xs">
              {c.opens_at ? fmtDate(c.opens_at) : "Non définie"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CalendarDays className="size-3.5 text-muted-foreground/50 shrink-0" />
            <span className="text-muted-foreground text-xs w-16 shrink-0">Clôture</span>
            <span className="font-medium text-foreground text-xs">
              {c.closes_at ? fmtDate(c.closes_at) : "Non définie"}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ── Action button ──────────────────────────────────────────────── */
function ActionBtn({
  icon, label, hint, onClick, disabled, variant,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  onClick: () => void
  disabled?: boolean
  variant: "primary" | "secondary" | "danger" | "publish"
}) {
  const cls = {
    primary:   "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-muted text-foreground hover:bg-muted/70 border border-border",
    danger:    "bg-status-bad-bg text-status-bad-text hover:bg-red-100 border border-red-200",
    publish:   "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm ring-2 ring-emerald-200",
  }[variant]

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed",
          cls,
        )}
      >
        {icon}
        {label}
      </button>
      {hint && (
        <span className="text-[10px] text-muted-foreground/60 leading-tight max-w-[180px]">
          {hint}
        </span>
      )}
    </div>
  )
}

/* ── Empty detail state ─────────────────────────────────────────── */
function EmptyDetail() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-card border-2 border-dashed border-border shadow-subtle">
        <Megaphone className="size-7 text-muted-foreground/25" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground mb-1">
          Sélectionnez une campagne
        </p>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          Cliquez sur une campagne dans la liste pour voir sa progression et ses actions.
        </p>
      </div>
    </div>
  )
}

/* ── Status filter pills ────────────────────────────────────────── */
type StatusFilter = "all" | "active" | "scheduled" | "draft" | "past"

const STATUS_FILTERS: { key: StatusFilter; label: string; dot: string }[] = [
  { key: "all",       label: "Toutes",     dot: "bg-gray-400"    },
  { key: "active",    label: "Actives",    dot: "bg-emerald-500" },
  { key: "scheduled", label: "Planifiées", dot: "bg-blue-400"    },
  { key: "draft",     label: "Brouillons", dot: "bg-gray-300"    },
  { key: "past",      label: "Passées",    dot: "bg-slate-300"   },
]

/* ── Main component ─────────────────────────────────────────────── */
export function CampaignsSidepanelClient({ campaigns }: { campaigns: CampaignItem[] }) {
  const [selectedId,    setSelectedId]    = React.useState<string | null>(null)
  const [search,        setSearch]        = React.useState("")
  const [statusFilter,  setStatusFilter]  = React.useState<StatusFilter>("all")
  const [sectorFilter,  setSectorFilter]  = React.useState<string>("all")

  const selected = campaigns.find((c) => c.id === selectedId) ?? null

  /* Auto-select first active campaign on mount */
  React.useEffect(() => {
    const first = campaigns.find((c) => c.status === "active") ?? campaigns[0]
    if (first) setSelectedId(first.id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* Derive unique sectors from data */
  const sectors = React.useMemo(() => {
    const seen = new Map<string, string>()
    campaigns.forEach((c) => seen.set(c.sector.code, c.sector.name))
    return Array.from(seen.entries()).map(([code, name]) => ({ code, name }))
  }, [campaigns])

  /* Filter logic */
  const filtered = React.useMemo(() => {
    const q = search.toLowerCase()
    return campaigns.filter((c) => {
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.sector.name.toLowerCase().includes(q) ||
        c.sector.code.toLowerCase().includes(q)

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "past"
          ? c.status === "closed" || c.status === "archived"
          : c.status === statusFilter)

      const matchSector = sectorFilter === "all" || c.sector.code === sectorFilter

      return matchSearch && matchStatus && matchSector
    })
  }, [campaigns, search, statusFilter, sectorFilter])

  const byStatus = (s: CampaignStatus) => filtered.filter((c) => c.status === s)

  const active    = byStatus("active")
  const scheduled = byStatus("scheduled")
  const draft     = byStatus("draft")
  const closed    = [...byStatus("closed"), ...byStatus("archived")]

  const hasFilters = search !== "" || statusFilter !== "all" || sectorFilter !== "all"

  function resetFilters() {
    setSearch("")
    setStatusFilter("all")
    setSectorFilter("all")
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>

      {/* ── Full-width filter bar ────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-b border-border bg-card flex items-center gap-3 flex-wrap">

        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 w-56 shrink-0">
          <Search className="size-3.5 text-muted-foreground/50 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une campagne…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="text-muted-foreground/50 hover:text-foreground">
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-border shrink-0" />

        {/* Status tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
          {STATUS_FILTERS.map(({ key, label, dot }) => {
            const isActive = statusFilter === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-background/60",
                )}
              >
                <span className={cn(
                  "size-2 rounded-full shrink-0",
                  isActive ? "bg-primary-foreground/60" : dot,
                )} />
                {label}
              </button>
            )
          })}
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-border shrink-0" />

        {/* Sector select */}
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="h-7 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/30 cursor-pointer"
        >
          <option value="all">Tous les secteurs</option>
          {sectors.map(({ code, name }) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>

        {/* Reset */}
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3" />
            Réinitialiser
          </button>
        )}

        {/* Count */}
        {!hasFilters && (
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {campaigns.length} campagne{campaigns.length !== 1 ? "s" : ""}
          </span>
        )}
        {hasFilters && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Two-panel row ───────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left list */}
        <aside className="w-72 shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto divide-y divide-border/30" style={{ scrollbarWidth: "thin" }}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Megaphone className="size-7 text-muted-foreground/20 mb-3" />
                <p className="text-xs text-muted-foreground">
                  {hasFilters ? "Aucun résultat pour ces filtres" : "Aucune campagne"}
                </p>
                {hasFilters && (
                  <button type="button" onClick={resetFilters} className="mt-2 text-xs text-primary hover:underline">
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <>
                <StatusGroup statusKey="active"    campaigns={active}    selectedId={selectedId} onSelect={setSelectedId} />
                <StatusGroup statusKey="scheduled" campaigns={scheduled} selectedId={selectedId} onSelect={setSelectedId} />
                <StatusGroup statusKey="draft"     campaigns={draft}     selectedId={selectedId} onSelect={setSelectedId} />
                {closed.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-3 py-2 sticky top-0 bg-card z-10 border-b border-border/40">
                      <span className="size-2 rounded-full bg-gray-200 shrink-0" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Passées</span>
                      <span className="text-[10px] text-muted-foreground/40 tabular-nums ml-auto">{closed.length}</span>
                    </div>
                    {closed.map((c) => (
                      <CampaignListItem
                        key={c.id}
                        c={c}
                        isSelected={c.id === selectedId}
                        onSelect={() => setSelectedId(c.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Right detail */}
        <div
          className="flex-1 overflow-hidden"
          style={{ background: "var(--color-surface-2, hsl(var(--muted)/0.3))" }}
        >
          {selected ? (
            <CampaignDetail c={selected} onClose={() => setSelectedId(null)} />
          ) : (
            <EmptyDetail />
          )}
        </div>
      </div>
    </div>
  )
}
