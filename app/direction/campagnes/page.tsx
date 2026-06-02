import Link from "next/link"
import { Plus, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Status display config ──────────────────────────────────── */
const CAMPAIGN_STATUS = {
  active:    { label: "Active",    strip: "bg-emerald-500", badgeBg: "bg-emerald-50",  badgeText: "text-emerald-700", badgeBorder: "border-emerald-200" },
  scheduled: { label: "Planifiée", strip: "bg-blue-500",    badgeBg: "bg-blue-50",     badgeText: "text-blue-700",    badgeBorder: "border-blue-200"    },
  draft:     { label: "Brouillon", strip: "bg-gray-200",    badgeBg: "bg-gray-50",     badgeText: "text-gray-500",    badgeBorder: "border-gray-200"    },
  closed:    { label: "Clôturée",  strip: "bg-slate-300",   badgeBg: "bg-slate-50",    badgeText: "text-slate-600",   badgeBorder: "border-slate-200"   },
  archived:  { label: "Archivée",  strip: "bg-gray-100",    badgeBg: "bg-gray-50",     badgeText: "text-gray-400",    badgeBorder: "border-gray-100"    },
} as const

const SECTOR_CHIP: Record<string, string> = {
  "Mines":     "bg-amber-500  text-white",
  "Finances":  "bg-blue-600   text-white",
  "Commerce":  "bg-orange-500 text-white",
  "Industrie": "bg-violet-500 text-white",
  "Energie":   "bg-emerald-600 text-white",
}

const PERIODICITY: Record<string, string> = {
  monthly: "Mensuel", quarterly: "Trimestriel", annual: "Annuel", one_off: "Ponctuel",
}

/* ── Types ──────────────────────────────────────────────────── */
type Status = keyof typeof CAMPAIGN_STATUS
type TargetStats = { total: number; validated: number; submitted: number }

type Campaign = {
  id: string
  title: string
  sector: { name: string; code: string }
  periodicity: string
  reference_period: string
  status: Status
  opens_at: string | null
  closes_at: string | null
  targets: TargetStats
}

/* ── Mock data ──────────────────────────────────────────────── */
function inDays(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]
}

const CAMPAIGNS: Campaign[] = [
  { id: "c1", title: "Collecte mensuelle Mines — Mai 2026",            sector: { name: "Mines",     code: "MINES"     }, periodicity: "monthly",   reference_period: "Mai 2026", status: "active",    opens_at: "2026-05-01", closes_at: inDays(4),  targets: { total: 50, validated: 26, submitted: 14 } },
  { id: "c2", title: "Bilan annuel Finance 2025",                      sector: { name: "Finances",  code: "FINANCE"   }, periodicity: "annual",    reference_period: "2025",     status: "active",    opens_at: "2026-05-01", closes_at: inDays(22), targets: { total: 12, validated: 9,  submitted: 2  } },
  { id: "c3", title: "Enquête trimestrielle Commerce — T2 2026",       sector: { name: "Commerce",  code: "COMMERCE"  }, periodicity: "quarterly", reference_period: "T2 2026",  status: "active",    opens_at: "2026-05-01", closes_at: inDays(31), targets: { total: 9,  validated: 0,  submitted: 3  } },
  { id: "c4", title: "Collecte énergie — Rapport semestriel S1",       sector: { name: "Energie",   code: "ENERGIE"   }, periodicity: "one_off",   reference_period: "S1 2026",  status: "active",    opens_at: "2026-05-01", closes_at: inDays(45), targets: { total: 7,  validated: 2,  submitted: 1  } },
  { id: "c7", title: "Collecte mensuelle Mines — Juin 2026",           sector: { name: "Mines",     code: "MINES"     }, periodicity: "monthly",   reference_period: "Juin 2026",status: "scheduled", opens_at: inDays(8),    closes_at: inDays(38), targets: { total: 50, validated: 0,  submitted: 0  } },
  { id: "c8", title: "Pilote Commerce numérique 2026",                 sector: { name: "Commerce",  code: "COMMERCE"  }, periodicity: "one_off",   reference_period: "2026",     status: "draft",     opens_at: null,         closes_at: null,       targets: { total: 0,  validated: 0,  submitted: 0  } },
  { id: "c5", title: "Collecte industrie Q4 2025",                     sector: { name: "Industrie", code: "INDUSTRIE" }, periodicity: "quarterly", reference_period: "Q4 2025",  status: "closed",    opens_at: "2026-01-01", closes_at: "2026-04-01", targets: { total: 5,  validated: 5,  submitted: 0  } },
  { id: "c6", title: "Enquête Finance T3 2025",                        sector: { name: "Finances",  code: "FINANCE"   }, periodicity: "quarterly", reference_period: "T3 2025",  status: "closed",    opens_at: "2025-10-01", closes_at: "2025-12-31", targets: { total: 12, validated: 10, submitted: 0  } },
  { id: "c9", title: "Bilan annuel Mines 2024",                        sector: { name: "Mines",     code: "MINES"     }, periodicity: "annual",    reference_period: "2024",     status: "archived",  opens_at: "2025-01-01", closes_at: "2025-06-30", targets: { total: 18, validated: 16, submitted: 0  } },
]

/* ── Helpers ────────────────────────────────────────────────── */
function daysUntil(s: string) {
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86_400_000)
}
function shortDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" })
}

/* ── Sub-components ─────────────────────────────────────────── */
function ProgressMini({ t }: { t: TargetStats }) {
  if (t.total === 0) return <span className="text-xs text-muted-foreground">—</span>
  const responded = t.validated + t.submitted
  const rate = Math.round((responded / t.total) * 100)
  const color = rate >= 80 ? "#22c55e" : rate >= 50 ? "#3b82f6" : "#f59e0b"
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="h-1 flex-1 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] tabular-nums text-gray-400 shrink-0 font-medium">{responded}/{t.total}</span>
    </div>
  )
}

function CampaignRow({ c, muted }: { c: Campaign; muted?: boolean }) {
  const cfg   = CAMPAIGN_STATUS[c.status]
  const chip  = SECTOR_CHIP[c.sector.name] ?? "bg-gray-500 text-white"
  const days  = c.closes_at ? daysUntil(c.closes_at) : null
  const isUrgent = days !== null && days <= 7 && c.status === "active"

  return (
    <Link
      href={`/direction/campagnes/${c.id}`}
      className={cn(
        "flex items-center group transition-colors",
        muted ? "hover:bg-muted/20 opacity-60 hover:opacity-100" : "hover:bg-muted/30",
      )}
    >
      {/* Status colour strip */}
      <div className={cn("w-[3px] self-stretch shrink-0", cfg.strip)} />

      <div className="flex flex-1 items-center gap-3 px-4 py-3 min-w-0">
        {/* Sector chip */}
        <span className={cn(
          "hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider leading-tight",
          chip,
        )}>
          {c.sector.code}
        </span>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", muted ? "text-muted-foreground" : "text-foreground")}>
            {c.title}
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            {c.reference_period} · {PERIODICITY[c.periodicity] ?? c.periodicity}
          </p>
        </div>

        {/* Progress */}
        <div className="hidden md:block w-28 shrink-0">
          <ProgressMini t={c.targets} />
        </div>

        {/* Deadline */}
        <div className="hidden lg:block w-20 shrink-0 text-right">
          {days !== null && c.status === "active" ? (
            <span className={cn(
              "text-[11px] font-bold tabular-nums",
              isUrgent ? (days <= 3 ? "text-red-600" : "text-orange-500") : "text-muted-foreground",
            )}>
              J‑{days}
            </span>
          ) : c.closes_at ? (
            <span className="text-[11px] text-muted-foreground">{shortDate(c.closes_at)}</span>
          ) : (
            <span className="text-[11px] text-muted-foreground/40">—</span>
          )}
        </div>

        {/* Status badge */}
        <span className={cn(
          "hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0",
          cfg.badgeBg, cfg.badgeText, cfg.badgeBorder,
        )}>
          {cfg.label}
        </span>

        <ArrowRight className="size-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
      </div>
    </Link>
  )
}

function CampaignGroup({
  label, dot, campaigns, muted = false,
}: {
  label: string; dot: string; campaigns: Campaign[]; muted?: boolean
}) {
  if (campaigns.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("size-2 rounded-full shrink-0", dot)} />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-semibold text-muted-foreground/50 tabular-nums ml-0.5">{campaigns.length}</span>
      </div>
      <div className="rounded-xl border-2 border-border bg-card shadow-medium overflow-hidden divide-y divide-border">
        {campaigns.map((c) => <CampaignRow key={c.id} c={c} muted={muted} />)}
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */
export default function CampagnesPage() {
  const active    = CAMPAIGNS.filter(c => c.status === "active")
  const scheduled = CAMPAIGNS.filter(c => c.status === "scheduled")
  const draft     = CAMPAIGNS.filter(c => c.status === "draft")
  const past      = CAMPAIGNS.filter(c => c.status === "closed" || c.status === "archived")

  const totalTargets    = active.reduce((s, c) => s + c.targets.total, 0)
  const totalValidated  = active.reduce((s, c) => s + c.targets.validated, 0)
  const totalResponded  = active.reduce((s, c) => s + c.targets.validated + c.targets.submitted, 0)
  const globalRate      = totalTargets > 0 ? Math.round((totalResponded / totalTargets) * 100) : 0

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Page header ───────────────────────────── */}
      <div className="px-6 py-5 border-b-2 border-border bg-card">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight text-foreground">
              Campagnes de collecte
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {CAMPAIGNS.length} campagnes · {active.length} active{active.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick stats */}
            <div className="hidden lg:flex items-center divide-x divide-border">
              <div className="pr-4 text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Ciblées</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{totalTargets}</p>
              </div>
              <div className="px-4 text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Validées</p>
                <p className="text-lg font-bold tabular-nums text-emerald-600">{totalValidated}</p>
              </div>
              <div className="pl-4 text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Taux réponse</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: globalRate >= 80 ? "#16a34a" : globalRate >= 50 ? "#2563eb" : "#d97706" }}>
                  {globalRate} %
                </p>
              </div>
            </div>

            <Link
              href="/direction/campagnes/nouvelle"
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="size-4" />
              Nouvelle campagne
            </Link>
          </div>
        </div>
      </div>

      {/* ── Lists ─────────────────────────────────── */}
      <div className="flex-1 p-6 space-y-5">
        <CampaignGroup label="Actives"              dot="bg-emerald-500" campaigns={active}    />
        <CampaignGroup label="Planifiées"           dot="bg-blue-500"   campaigns={scheduled} />
        <CampaignGroup label="Brouillons"           dot="bg-gray-300"   campaigns={draft}     />
        <CampaignGroup label="Clôturées · Archivées" dot="bg-gray-200"   campaigns={past}   muted />
      </div>
    </div>
  )
}
