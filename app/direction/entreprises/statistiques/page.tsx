import Link from "next/link"
import { ArrowLeft, Building2, TrendingUp, Clock, CheckCircle2, XCircle, BarChart3, Users, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Mock analytics data ────────────────────────────────────── */
const MOCK = {
  totals: { total: 59, validated: 47, pending: 8, rejected: 3, suspended: 1 },

  bySector: [
    { name: "Mines",     code: "MINES",     validated: 18, pending: 3, total: 21 },
    { name: "Finances",  code: "FINANCE",   validated: 12, pending: 2, total: 14 },
    { name: "Commerce",  code: "COMMERCE",  validated:  9, pending: 1, total: 10 },
    { name: "Industrie", code: "INDUSTRIE", validated:  5, pending: 1, total:  6 },
    { name: "Energie",   code: "ENERGIE",   validated:  3, pending: 1, total:  4 },
  ],

  bySize: [
    { label: "Grande entreprise", count: 22, pct: 47 },
    { label: "PME",               count: 19, pct: 40 },
    { label: "TPE",               count:  6, pct: 13 },
  ],

  byLegalStatus: [
    { label: "SA",    count: 24, pct: 51 },
    { label: "SARL",  count: 14, pct: 30 },
    { label: "SUARL", count:  5, pct: 11 },
    { label: "GIE",   count:  2, pct:  4 },
    { label: "Autre", count:  2, pct:  4 },
  ],

  byRegion: [
    { region: "Conakry",          count: 31 },
    { region: "Boké",             count:  6 },
    { region: "Kindia",           count:  4 },
    { region: "Mamou",            count:  3 },
    { region: "Kankan",           count:  2 },
    { region: "Autres régions",   count:  1 },
  ],

  registrationsTrend: [
    { month: "Jan 2026", count: 3 },
    { month: "Fév 2026", count: 5 },
    { month: "Mar 2026", count: 2 },
    { month: "Avr 2026", count: 7 },
    { month: "Mai 2026", count: 4 },
    { month: "Jun 2026", count: 1 },
  ],

  recentValidations: [
    { id: "e1", name: "Compagnie Bauxite de Guinée",    sector: "Mines",     validated_at: "2026-06-01T10:30:00Z", size: "grande_entreprise" },
    { id: "e2", name: "Energie Plus SARL",              sector: "Energie",   validated_at: "2026-05-31T14:15:00Z", size: "pme"               },
    { id: "e3", name: "FinanceGroup Guinée SA",         sector: "Finances",  validated_at: "2026-05-30T09:00:00Z", size: "grande_entreprise" },
    { id: "e4", name: "Société Commerciale de Conakry", sector: "Commerce",  validated_at: "2026-05-29T16:45:00Z", size: "pme"               },
    { id: "e5", name: "Industries Guinéennes Réunies",  sector: "Industrie", validated_at: "2026-05-28T11:20:00Z", size: "grande_entreprise" },
  ],
}

/* ── Sector theme ────────────────────────────────────────────── */
const SECTOR_THEME: Record<string, { strip: string; chip: string; bar: string }> = {
  "Mines":     { strip: "bg-amber-500",   chip: "bg-amber-500   text-white", bar: "bg-amber-400"   },
  "Finances":  { strip: "bg-blue-600",    chip: "bg-blue-600    text-white", bar: "bg-blue-500"    },
  "Commerce":  { strip: "bg-orange-500",  chip: "bg-orange-500  text-white", bar: "bg-orange-400"  },
  "Industrie": { strip: "bg-violet-500",  chip: "bg-violet-500  text-white", bar: "bg-violet-400"  },
  "Energie":   { strip: "bg-emerald-600", chip: "bg-emerald-600 text-white", bar: "bg-emerald-500" },
}

const SIZE_LABEL: Record<string, string> = {
  grande_entreprise: "Grande entreprise",
  pme: "PME",
  tpe: "TPE",
}

/* ── Helpers ─────────────────────────────────────────────────── */
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
}

/* ── Inline bar ──────────────────────────────────────────────── */
function Bar({ pct, colorClass }: { pct: number; colorClass: string }) {
  return (
    <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", colorClass)} style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ── Sparkline (pure SVG) ────────────────────────────────────── */
function Sparkline({ data, color = "#2563eb" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1)
  const w = 200, h = 40
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * (h - 4)
    return `${x},${y}`
  }).join(" ")
  const area = `0,${h} ${pts} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spark-fill)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Page ────────────────────────────────────────────────────── */
export default function EntreprisesStatistiquesPage() {
  const { totals, bySector, bySize, byLegalStatus, byRegion, registrationsTrend, recentValidations } = MOCK
  const validationRate = Math.round((totals.validated / totals.total) * 100)
  const maxSector      = Math.max(...bySector.map(s => s.total))
  const maxRegion      = byRegion[0]?.count ?? 1
  const trendData      = registrationsTrend.map(t => t.count)
  const trendTotal     = trendData.reduce((s, v) => s + v, 0)

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Header ────────────────────────────────── */}
      <div className="px-6 py-5 border-b-2 border-border bg-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link
              href="/direction/entreprises"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              <ArrowLeft className="size-3" /> Répertoire entreprises
            </Link>
            <h1 className="text-[18px] font-semibold tracking-tight text-foreground flex items-center gap-2">
              <BarChart3 className="size-5 text-muted-foreground" />
              Statistiques — Répertoire entreprises
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Analyse et distribution des entreprises inscrites sur la plateforme
            </p>
          </div>
          <Link
            href="/direction/entreprises"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border-2 border-border bg-card hover:bg-muted/60 transition-colors"
          >
            <Users className="size-4" />
            Voir le répertoire
          </Link>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-5">

        {/* ── KPI strip ─────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Total inscrites",    value: totals.total,     Icon: Building2,    colorClass: "text-foreground"    },
            { label: "Validées",           value: totals.validated, Icon: CheckCircle2, colorClass: "text-emerald-600"   },
            { label: "En attente",         value: totals.pending,   Icon: Clock,        colorClass: "text-amber-600"     },
            { label: "Rejetées",           value: totals.rejected,  Icon: XCircle,      colorClass: "text-red-600"       },
            { label: "Taux de validation", value: `${validationRate} %`, Icon: TrendingUp, colorClass: validationRate >= 80 ? "text-emerald-600" : "text-amber-600" },
          ].map(({ label, value, Icon, colorClass }) => (
            <div key={label} className="rounded-xl border-2 border-border bg-card p-4 shadow-medium">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                <Icon className="size-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
              </div>
              <p className={cn("text-2xl font-bold tabular-nums", colorClass)}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Row 2: by sector + trend ──────────────── */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* By sector */}
          <div className="lg:col-span-2 rounded-xl border-2 border-border bg-card shadow-medium overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-muted/20">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Répartition par secteur d&apos;activité
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {bySector.map(s => {
                const theme   = SECTOR_THEME[s.name] ?? { strip: "bg-gray-400", chip: "bg-gray-400 text-white", bar: "bg-gray-400" }
                const barPct  = Math.round((s.total / maxSector) * 100)
                const valPct  = Math.round((s.validated / s.total) * 100)
                return (
                  <div key={s.code} className="flex items-center gap-3">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 w-20 text-center", theme.chip)}>
                      {s.code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">{s.name}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">{s.validated}/{s.total}</span>
                      </div>
                      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                        {/* Total bar */}
                        <div className={cn("absolute inset-y-0 left-0 rounded-full opacity-30", theme.bar)} style={{ width: `${barPct}%` }} />
                        {/* Validated bar */}
                        <div className={cn("absolute inset-y-0 left-0 rounded-full", theme.bar)} style={{ width: `${barPct * valPct / 100}%` }} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-bold tabular-nums text-foreground">{valPct}%</span>
                      <p className="text-[10px] text-muted-foreground">validé{valPct !== 1 ? "es" : "e"}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Registration trend */}
          <div className="rounded-xl border-2 border-border bg-card shadow-medium overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-muted/20">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Inscriptions — 6 derniers mois
              </h2>
            </div>
            <div className="p-5">
              <div className="mb-3">
                <p className="text-2xl font-bold tabular-nums text-foreground">{trendTotal}</p>
                <p className="text-xs text-muted-foreground">nouvelles inscriptions</p>
              </div>
              <Sparkline data={trendData} color="#2563eb" />
              <div className="mt-3 grid grid-cols-3 gap-1">
                {registrationsTrend.map(t => (
                  <div key={t.month} className="text-center">
                    <p className="text-sm font-bold tabular-nums text-foreground">{t.count}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">{t.month.split(" ")[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: size + legal + region ──────────── */}
        <div className="grid gap-4 sm:grid-cols-3">

          {/* By size */}
          <div className="rounded-xl border-2 border-border bg-card shadow-medium overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-muted/20">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Par taille</h2>
            </div>
            <div className="p-4 space-y-3">
              {bySize.map(({ label, count, pct }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground flex-1 truncate">{label}</span>
                  <Bar pct={pct} colorClass="bg-primary/70" />
                  <span className="text-xs font-bold tabular-nums text-foreground w-5 text-right shrink-0">{count}</span>
                  <span className="text-[10px] text-muted-foreground/60 w-7 text-right shrink-0">{pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* By legal status */}
          <div className="rounded-xl border-2 border-border bg-card shadow-medium overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-muted/20">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Forme juridique</h2>
            </div>
            <div className="p-4 space-y-3">
              {byLegalStatus.map(({ label, count, pct }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-muted-foreground w-10 shrink-0">{label}</span>
                  <Bar pct={pct} colorClass="bg-violet-400" />
                  <span className="text-xs font-bold tabular-nums text-foreground w-5 text-right shrink-0">{count}</span>
                  <span className="text-[10px] text-muted-foreground/60 w-7 text-right shrink-0">{pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* By region */}
          <div className="rounded-xl border-2 border-border bg-card shadow-medium overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
              <MapPin className="size-3.5 text-muted-foreground" />
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Par région</h2>
            </div>
            <div className="p-4 space-y-3">
              {byRegion.map(({ region, count }) => {
                const pct = Math.round((count / maxRegion) * 100)
                return (
                  <div key={region} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground flex-1 truncate">{region}</span>
                    <Bar pct={pct} colorClass="bg-amber-400" />
                    <span className="text-xs font-bold tabular-nums text-foreground w-5 text-right shrink-0">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Recent validations ────────────────────── */}
        <div className="rounded-xl border-2 border-border bg-card shadow-medium overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="size-3.5" />
              Dernières validations
            </h2>
            <Link href="/direction/entreprises" className="text-xs text-primary font-medium hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentValidations.map(e => {
              const theme = SECTOR_THEME[e.sector] ?? { chip: "bg-gray-400 text-white" }
              return (
                <Link
                  key={e.id}
                  href={`/direction/entreprises/${e.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors group"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{SIZE_LABEL[e.size] ?? e.size}</p>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded hidden sm:inline", theme.chip)}>
                    {e.sector.toUpperCase().slice(0, 7)}
                  </span>
                  <time className="text-xs text-muted-foreground shrink-0 hidden md:block">
                    {fmtDate(e.validated_at)}
                  </time>
                </Link>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
