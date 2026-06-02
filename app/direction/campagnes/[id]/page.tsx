import Link from "next/link"
import {
  ArrowLeft, Calendar, Users, FileText, CheckCircle2,
  Clock, XCircle, Loader2, Send, Archive, X,
  TrendingUp, Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Mock data (one campaign detail) ───────────────────────── */
const MOCK = {
  id: "c1",
  title: "Collecte mensuelle Mines — Mai 2026",
  sector: { name: "Mines", code: "MINES" },
  periodicity: "monthly",
  reference_period: "Mai 2026",
  status: "active" as const,
  target_mode: "sector",
  opens_at:  "2026-05-01T00:00:00Z",
  closes_at: (() => { const d = new Date(); d.setDate(d.getDate() + 4); return d.toISOString() })(),
  sent_at:   "2026-05-01T08:00:00Z",
  closed_at: null,
  created_at:"2026-04-20T10:30:00Z",
  form_version: { version_number: 3 },
  targets: [
    { company: "Compagnie Bauxite de Guinée",      status: "validated"   },
    { company: "Société Minière de Boké",           status: "validated"   },
    { company: "Guinea Alumina Corporation",         status: "validated"   },
    { company: "Rio Tinto Simandou SA",              status: "validated"   },
    { company: "SMB-Winning Consortium",             status: "validated"   },
    { company: "Société Minière Kamsar",             status: "validated"   },
    { company: "West African Resources Guinea",      status: "validated"   },
    { company: "Minières du Foutah",                 status: "validated"   },
    { company: "COBAD Mining SA",                    status: "validated"   },
    { company: "Société Minière de Dinguiraye",      status: "submitted"   },
    { company: "Mines de Fer de Guinée",             status: "submitted"   },
    { company: "Société Aurifère de Guinée",         status: "submitted"   },
    { company: "ANAIM Mineral Resources",            status: "submitted"   },
    { company: "Société Extractive du Nimba",        status: "in_progress" },
    { company: "Kindia Bauxite Company",             status: "in_progress" },
    { company: "Fria Aluminium Guinée",              status: "waiting"     },
    { company: "Société Minière de Labé",            status: "waiting"     },
    { company: "Exploitation Aurifère Kouroussa",    status: "waiting"     },
  ],
}

/* ── Config ─────────────────────────────────────────────────── */
const CAMPAIGN_STATUS_CFG = {
  active:    { label: "Active",    bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-300", dot: "bg-emerald-500" },
  scheduled: { label: "Planifiée", bg: "bg-blue-500/10",    text: "text-blue-700",    border: "border-blue-300",    dot: "bg-blue-500"    },
  draft:     { label: "Brouillon", bg: "bg-gray-100",       text: "text-gray-600",    border: "border-gray-200",    dot: "bg-gray-300"    },
  closed:    { label: "Clôturée",  bg: "bg-slate-100",      text: "text-slate-600",   border: "border-slate-200",   dot: "bg-slate-400"   },
  archived:  { label: "Archivée",  bg: "bg-gray-50",        text: "text-gray-400",    border: "border-gray-100",    dot: "bg-gray-200"    },
} as const

const TARGET_STATUS_CFG = [
  { key: "validated",   label: "Validées",   Icon: CheckCircle2, color: "#22c55e", textClass: "text-emerald-700", bgClass: "bg-emerald-50", dotClass: "bg-emerald-500" },
  { key: "submitted",   label: "Soumises",   Icon: TrendingUp,   color: "#3b82f6", textClass: "text-blue-700",    bgClass: "bg-blue-50",    dotClass: "bg-blue-500"    },
  { key: "in_progress", label: "En cours",   Icon: Loader2,      color: "#8b5cf6", textClass: "text-violet-700",  bgClass: "bg-violet-50",  dotClass: "bg-violet-500"  },
  { key: "waiting",     label: "En attente", Icon: Clock,        color: "#9ca3af", textClass: "text-gray-500",    bgClass: "bg-gray-50",    dotClass: "bg-gray-400"    },
  { key: "rejected",    label: "Rejetées",   Icon: XCircle,      color: "#ef4444", textClass: "text-red-700",     bgClass: "bg-red-50",     dotClass: "bg-red-500"     },
] as const

const SECTOR_COLOR: Record<string, { strip: string; chip: string }> = {
  "Mines":     { strip: "bg-amber-500",   chip: "bg-amber-500 text-white"   },
  "Finances":  { strip: "bg-blue-600",    chip: "bg-blue-600  text-white"   },
  "Commerce":  { strip: "bg-orange-500",  chip: "bg-orange-500 text-white"  },
  "Industrie": { strip: "bg-violet-500",  chip: "bg-violet-500 text-white"  },
  "Energie":   { strip: "bg-emerald-600", chip: "bg-emerald-600 text-white" },
}

const PERIODICITY: Record<string, string> = {
  monthly: "Mensuelle", quarterly: "Trimestrielle", annual: "Annuelle", one_off: "Ponctuelle",
}

/* ── Helpers ────────────────────────────────────────────────── */
function daysUntil(s: string) {
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86_400_000)
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}
function fmtDateTime(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

/* ── Circular SVG progress ───────────────────────────────────── */
function CircleProgress({ pct, size = 96 }: { pct: number; size?: number }) {
  const sw = 8
  const r  = (size - sw) / 2
  const c  = 2 * Math.PI * r
  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#3b82f6" : "#f59e0b"
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={c} strokeDashoffset={c - (pct/100)*c} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-bold tabular-nums leading-none" style={{ color }}>{pct}%</span>
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">réponse</span>
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */
export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await params

  const c = MOCK
  const sectorCfg = SECTOR_COLOR[c.sector.name] ?? { strip: "bg-gray-400", chip: "bg-gray-400 text-white" }
  const statusCfg = CAMPAIGN_STATUS_CFG[c.status]
  const days = c.closes_at ? daysUntil(c.closes_at) : null

  const total      = c.targets.length
  const validated  = c.targets.filter(t => t.status === "validated").length
  const submitted  = c.targets.filter(t => t.status === "submitted").length
  const inProgress = c.targets.filter(t => t.status === "in_progress").length
  const waiting    = c.targets.filter(t => t.status === "waiting").length
  const rejected   = c.targets.filter(t => t.status === "rejected").length
  const responded  = validated + submitted
  const rate       = total > 0 ? Math.round((responded / total) * 100) : 0

  const statCounts = { validated, submitted, in_progress: inProgress, waiting, rejected }

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Hero header ────────────────────────────── */}
      <div className="border-b-2 border-border bg-card">
        {/* Sector colour bar */}
        <div className={cn("h-1", sectorCfg.strip)} />

        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link
                href="/direction/campagnes"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <ArrowLeft className="size-3" /> Campagnes
              </Link>

              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider", sectorCfg.chip)}>
                  {c.sector.code}
                </span>
                <span className="text-xs text-muted-foreground">{c.sector.name}</span>
                <span className="text-muted-foreground/30 text-xs">·</span>
                <span className="text-xs text-muted-foreground">{PERIODICITY[c.periodicity] ?? c.periodicity}</span>
                <span className="text-muted-foreground/30 text-xs">·</span>
                <span className="text-xs font-semibold text-foreground">{c.reference_period}</span>
              </div>

              <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
                {c.title}
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status pill */}
              <span className={cn(
                "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border",
                statusCfg.bg, statusCfg.text, statusCfg.border,
              )}>
                <span className={cn("size-1.5 rounded-full", statusCfg.dot)} />
                {statusCfg.label}
              </span>
              {days !== null && c.status === "active" && (
                <span className={cn(
                  "text-xs font-bold px-2.5 py-1.5 rounded-full",
                  days <= 3 ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                  : days <= 7 ? "bg-orange-50 text-orange-700"
                  : "bg-muted text-muted-foreground",
                )}>
                  J‑{days}
                </span>
              )}
              {/* Actions */}
              <button className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border-2 border-border bg-card hover:bg-muted/60 transition-colors">
                <Send className="size-3.5 text-muted-foreground" />
                Relancer
              </button>
              <button className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors">
                <Archive className="size-3.5" />
                Suspendre
              </button>
              <button className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                <X className="size-3.5" />
                Clôturer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────── */}
      <div className="flex-1 p-6 space-y-5">

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Entreprises ciblées", value: total, Icon: Users,       valueClass: "text-foreground"    },
            { label: "Taux de réponse",     value: `${rate} %`, Icon: TrendingUp, valueClass: rate >= 80 ? "text-emerald-600" : rate >= 50 ? "text-blue-600" : "text-amber-500" },
            { label: "Validées",            value: validated,   Icon: CheckCircle2, valueClass: "text-emerald-600" },
            { label: "En attente",          value: waiting + inProgress, Icon: Clock, valueClass: "text-muted-foreground" },
          ].map(({ label, value, Icon, valueClass }) => (
            <div key={label} className="rounded-xl border-2 border-border bg-card p-4 shadow-medium">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                <Icon className="size-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
              </div>
              <p className={cn("text-2xl font-bold tabular-nums", valueClass)}>{value}</p>
            </div>
          ))}
        </div>

        {/* Progress + breakdown */}
        <div className="rounded-xl border-2 border-border bg-card shadow-medium overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/20">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Users className="size-3.5" />
              Entreprises ciblées — répartition
            </h2>
          </div>
          <div className="p-5 flex items-start gap-6 flex-wrap">
            <CircleProgress pct={rate} size={96} />

            <div className="flex-1 min-w-52 space-y-2.5">
              {TARGET_STATUS_CFG.map(({ key, label, color, dotClass }) => {
                const count = statCounts[key as keyof typeof statCounts] ?? 0
                if (count === 0) return null
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={key} className="flex items-center gap-2.5">
                    <div className={cn("size-2 rounded-full shrink-0", dotClass)} />
                    <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-xs tabular-nums font-semibold text-foreground w-5 text-right shrink-0">{count}</span>
                    <span className="text-[10px] text-muted-foreground/50 w-8 text-right shrink-0">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Meta + dates */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: Calendar, label: "Ouverture",   value: c.opens_at  ? fmtDate(c.opens_at)  : "—" },
            { Icon: Calendar, label: "Clôture",     value: c.closes_at ? fmtDate(c.closes_at) : "—" },
            { Icon: FileText, label: "Formulaire",  value: `Version ${c.form_version.version_number}` },
            { Icon: Building2,label: "Ciblage",     value: c.target_mode === "sector" ? "Tout le secteur" : "Sélection spécifique" },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="rounded-xl border-2 border-border bg-card p-4 shadow-medium flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Target companies list */}
        <div className="rounded-xl border-2 border-border bg-card shadow-medium overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Building2 className="size-3.5" />
              Liste des entreprises ciblées
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">{total} entreprises</span>
          </div>
          <div className="divide-y divide-border">
            {c.targets.map((t, i) => {
              const cfg = TARGET_STATUS_CFG.find(s => s.key === t.status)!
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/20 transition-colors">
                  <div className={cn("size-2 rounded-full shrink-0", cfg.dotClass)} />
                  <p className="flex-1 text-sm text-foreground truncate">{t.company}</p>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    cfg.bgClass, cfg.textClass,
                  )}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Metadata row */}
        <div className="rounded-xl border-2 border-border bg-card p-4 shadow-medium">
          <dl className="flex flex-wrap gap-x-8 gap-y-1.5 text-sm">
            <div className="flex gap-2"><dt className="text-muted-foreground w-24 shrink-0 text-xs font-medium">Créée le</dt><dd className="text-xs font-semibold text-foreground">{fmtDateTime(c.created_at)}</dd></div>
            {c.sent_at && <div className="flex gap-2"><dt className="text-muted-foreground w-24 shrink-0 text-xs font-medium">Activée le</dt><dd className="text-xs font-semibold text-foreground">{fmtDateTime(c.sent_at)}</dd></div>}
            {c.closed_at && <div className="flex gap-2"><dt className="text-muted-foreground w-24 shrink-0 text-xs font-medium">Clôturée le</dt><dd className="text-xs font-semibold text-foreground">{fmtDateTime(c.closed_at)}</dd></div>}
          </dl>
        </div>
      </div>
    </div>
  )
}
