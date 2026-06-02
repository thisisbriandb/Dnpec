import {
  Building2,
  Clock,
  Megaphone,
  CheckSquare,
  Activity,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  CalendarClock,
} from "lucide-react"
import Link from "next/link"
import { StatCard }        from "@/components/ui/stat-card"
import { Badge }           from "@/components/ui/badge"
import { buttonVariants }  from "@/components/ui/button"
import { formatDate }      from "@/lib/format"
import { cn }              from "@/lib/utils"
import { CampaignSidepanel }                 from "@/app/direction/_components/campaign-sidepanel"
import { SubmissionDonutChart, SectorBarChart } from "@/app/direction/_components/dashboard-charts"

export const dynamic = "force-dynamic"

/* ── Label maps ─────────────────────────────────────────────── */
const ACTION_LABELS: Record<string, string> = {
  insert: "Créé",
  update: "Modifié",
  delete: "Supprimé",
}
const TABLE_LABELS: Record<string, string> = {
  companies:        "Entreprise",
  campaigns:        "Campagne",
  submissions:      "Soumission",
  form_versions:    "Formulaire",
  campaign_targets: "Cible",
  company_documents:"Document",
}
const ACTION_DOT: Record<string, string> = {
  insert: "bg-status-ok",
  update: "bg-status-info",
  delete: "bg-status-bad",
}

/* ── Mock data ──────────────────────────────────────────────── */

// KPI
const MOCK_VALIDATED_COMPANIES = 47
const MOCK_PENDING_COMPANIES   = 8
const MOCK_REJECTED_COMPANIES  = 3
const MOCK_SUSPENDED_COMPANIES = 1
const MOCK_TOTAL_COMPANIES     = 59
const MOCK_SCHEDULED_CAMPAIGNS = 2
const MOCK_TO_VALIDATE         = 23
const MOCK_TOTAL_SUBMISSIONS   = 93
const MOCK_TOTAL_TARGETS       = 71
const MOCK_RESPONDED_TARGETS   = 56
const MOCK_RESPONSE_RATE       = Math.round((MOCK_RESPONDED_TARGETS / MOCK_TOTAL_TARGETS) * 100)

// Active campaigns — target statuses: waiting | in_progress | submitted | validated | rejected
const MOCK_ACTIVE_CAMPAIGNS = [
  {
    id: "c1",
    title: "Collecte mensuelle Mines — Mai 2026",
    reference_period: "Mai 2026",
    periodicity: "monthly",
    closes_at: (() => { const d = new Date(); d.setDate(d.getDate() + 4); return d.toISOString() })(),
    sector: { name: "Mines" },
    targets: [
      ...Array.from({ length: 26 }, (_, i) => ({ id: `t${i}`,      status: "validated"   })),
      ...Array.from({ length: 14 }, (_, i) => ({ id: `t${i + 26}`, status: "submitted"   })),
      ...Array.from({ length:  5 }, (_, i) => ({ id: `t${i + 40}`, status: "in_progress" })),
      ...Array.from({ length:  5 }, (_, i) => ({ id: `t${i + 45}`, status: "waiting"     })),
    ],
  },
  {
    id: "c2",
    title: "Bilan annuel Finance 2025",
    reference_period: "2025",
    periodicity: "annual",
    closes_at: (() => { const d = new Date(); d.setDate(d.getDate() + 22); return d.toISOString() })(),
    sector: { name: "Finances" },
    targets: [
      ...Array.from({ length:  9 }, (_, i) => ({ id: `f${i}`,     status: "validated"  })),
      ...Array.from({ length:  2 }, (_, i) => ({ id: `f${i + 9}`, status: "submitted"  })),
      { id: "f11", status: "rejected" },
    ],
  },
  {
    id: "c3",
    title: "Enquête trimestrielle Commerce — T2 2026",
    reference_period: "T2 2026",
    periodicity: "quarterly",
    closes_at: (() => { const d = new Date(); d.setDate(d.getDate() + 31); return d.toISOString() })(),
    sector: { name: "Commerce" },
    targets: [
      ...Array.from({ length: 3 }, (_, i) => ({ id: `cm${i}`,     status: "submitted"   })),
      ...Array.from({ length: 2 }, (_, i) => ({ id: `cm${i + 3}`, status: "in_progress" })),
      ...Array.from({ length: 4 }, (_, i) => ({ id: `cm${i + 5}`, status: "waiting"     })),
    ],
  },
  {
    id: "c4",
    title: "Collecte énergie — Rapport semestriel S1",
    reference_period: "S1 2026",
    periodicity: "one_off",
    closes_at: (() => { const d = new Date(); d.setDate(d.getDate() + 45); return d.toISOString() })(),
    sector: { name: "Energie" },
    targets: [
      ...Array.from({ length: 2 }, (_, i) => ({ id: `e${i}`,     status: "validated"   })),
      ...Array.from({ length: 1 }, (_, i) => ({ id: `e${i + 2}`, status: "submitted"   })),
      ...Array.from({ length: 4 }, (_, i) => ({ id: `e${i + 3}`, status: "waiting"     })),
    ],
  },
]

// Donut chart data
const SUBMISSION_DONUT_DATA = [
  { name: "Validées",           value: 38, color: "#22c55e" },
  { name: "Soumises",          value: 23, color: "#3b82f6" },
  { name: "Correction dem.",    value:  9, color: "#f59e0b" },
  { name: "Rejetées",          value:  7, color: "#ef4444" },
  { name: "Brouillons",        value: 16, color: "#d1d5db" },
]

// Horizontal bar chart data
const SECTOR_BAR_DATA = [
  { name: "Mines",     count: 18, color: "#f59e0b" },
  { name: "Finances",  count: 12, color: "#3b82f6" },
  { name: "Commerce",  count:  9, color: "#ea580c" },
  { name: "Industrie", count:  5, color: "#7c3aed" },
  { name: "Energie",   count:  3, color: "#16a34a" },
]

// Pending queue
const MOCK_PENDING_QUEUE = [
  { id: "p1", name: "Société Minière Kamsar SA",      contact_email: "direction@smk.gn",         created_at: (() => { const d = new Date(); d.setHours(d.getHours() - 1);    return d.toISOString() })(), sector: { name: "Mines" }      },
  { id: "p2", name: "Energie Plus SARL",              contact_email: "contact@energieplus.gn",    created_at: (() => { const d = new Date(); d.setHours(d.getHours() - 4);    return d.toISOString() })(), sector: { name: "Energie" }    },
  { id: "p3", name: "FinanceGroup Guinée SA",         contact_email: "admin@financegroup.gn",     created_at: (() => { const d = new Date(); d.setDate(d.getDate() - 1);      return d.toISOString() })(), sector: { name: "Finances" }   },
  { id: "p4", name: "Société Commerciale de Conakry", contact_email: "info@scc.gn",              created_at: (() => { const d = new Date(); d.setDate(d.getDate() - 2);      return d.toISOString() })(), sector: { name: "Commerce" }   },
  { id: "p5", name: "Industries Guinéennes Réunies",  contact_email: "dg@igr.gn",                created_at: (() => { const d = new Date(); d.setDate(d.getDate() - 3);      return d.toISOString() })(), sector: { name: "Industrie" }  },
]

// Audit logs
const MOCK_LOGS = [
  { id: "l1", action: "update", entity_table: "submissions",      created_at: (() => { const d = new Date(); d.setMinutes(d.getMinutes() - 8);  return d.toISOString() })(), actor: { full_name: "Mariam Diallo"     } },
  { id: "l2", action: "insert", entity_table: "campaigns",        created_at: (() => { const d = new Date(); d.setMinutes(d.getMinutes() - 23); return d.toISOString() })(), actor: { full_name: "Ibrahim Kouyaté"   } },
  { id: "l3", action: "update", entity_table: "companies",        created_at: (() => { const d = new Date(); d.setHours(d.getHours() - 1);      return d.toISOString() })(), actor: { full_name: "Fatoumata Camara"  } },
  { id: "l4", action: "insert", entity_table: "submissions",      created_at: (() => { const d = new Date(); d.setHours(d.getHours() - 2);      return d.toISOString() })(), actor: { full_name: "Abdoulaye Barry"   } },
  { id: "l5", action: "update", entity_table: "companies",        created_at: (() => { const d = new Date(); d.setHours(d.getHours() - 3);      return d.toISOString() })(), actor: { full_name: "Mariam Diallo"     } },
  { id: "l6", action: "insert", entity_table: "form_versions",    created_at: (() => { const d = new Date(); d.setHours(d.getHours() - 5);      return d.toISOString() })(), actor: { full_name: "Ibrahim Kouyaté"   } },
  { id: "l7", action: "update", entity_table: "campaign_targets", created_at: (() => { const d = new Date(); d.setHours(d.getHours() - 7);      return d.toISOString() })(), actor: { full_name: "Fatoumata Camara"  } },
]

/* ── Helpers ────────────────────────────────────────────────── */
function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)    return "à l'instant"
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

/* ── Page ───────────────────────────────────────────────────── */
export default function DirectionDashboardPage() {
  return (
    <div className="min-h-full bg-muted/30 p-6 space-y-6">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-title font-semibold text-foreground">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue globale de la plateforme · {formatDate(new Date())}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/direction/entreprises/inscriptions"
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
          >
            <AlertTriangle className="size-3.5" />
            {MOCK_PENDING_COMPANIES} inscriptions en attente
          </Link>
          <Link
            href="/direction/validations"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
          >
            <CheckSquare className="size-3.5" />
            {MOCK_TO_VALIDATE} à valider
          </Link>
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Entreprises validées"
          value={MOCK_VALIDATED_COMPANIES}
          icon={<Building2 className="size-4" />}
          sparklineColor="ok"
          deltaLabel={`sur ${MOCK_TOTAL_COMPANIES} inscrites`}
        />
        <StatCard
          label="Inscriptions en attente"
          value={MOCK_PENDING_COMPANIES}
          icon={<Clock className="size-4" />}
          sparklineColor="warn"
          deltaLabel={`${MOCK_REJECTED_COMPANIES + MOCK_SUSPENDED_COMPANIES} inactives`}
        />
        <StatCard
          label="Campagnes actives"
          value={MOCK_ACTIVE_CAMPAIGNS.length}
          icon={<Megaphone className="size-4" />}
          sparklineColor="ok"
          deltaLabel={`+ ${MOCK_SCHEDULED_CAMPAIGNS} planifiées`}
        />
        <StatCard
          label="Taux de réponse"
          value={`${MOCK_RESPONSE_RATE} %`}
          icon={<TrendingUp className="size-4" />}
          sparklineColor="warn"
          deltaLabel={`${MOCK_RESPONDED_TARGETS} / ${MOCK_TOTAL_TARGETS} soumis`}
        />
        <StatCard
          label="Soumissions à valider"
          value={MOCK_TO_VALIDATE}
          icon={<CheckSquare className="size-4" />}
          sparklineColor="info"
          deltaLabel={`sur ${MOCK_TOTAL_SUBMISSIONS} soumissions`}
        />
      </div>

      {/* ── Campagnes — sidepanel interactif ────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Megaphone className="size-4 text-muted-foreground" />
            Campagnes actives
            <Badge variant="secondary">{MOCK_ACTIVE_CAMPAIGNS.length}</Badge>
          </h2>
          <Link
            href="/direction/campagnes"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            Toutes les campagnes
            <ArrowRight className="size-3" />
          </Link>
        </div>
        <CampaignSidepanel campaigns={MOCK_ACTIVE_CAMPAIGNS} />
      </section>

      {/* ── Graphiques : donut + barre horizontale ───────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SubmissionDonutChart
          data={SUBMISSION_DONUT_DATA}
          total={MOCK_TOTAL_SUBMISSIONS}
        />
        <SectorBarChart data={SECTOR_BAR_DATA} />
      </div>

      {/* ── Bas de page : inscriptions + activité côte à côte ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-start">

        {/* Inscriptions en attente */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              Inscriptions en attente
              <Badge variant="secondary">{MOCK_PENDING_COMPANIES}</Badge>
            </h2>
            <Link
              href="/direction/entreprises/inscriptions"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Tout traiter
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="rounded-card border border-border bg-card shadow-subtle overflow-hidden divide-y divide-border">
            {MOCK_PENDING_QUEUE.map((company) => (
              <div key={company.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-status-warn-bg">
                  <Building2 className="size-3.5 text-status-warn-text" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{company.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {company.sector?.name ?? "—"} · {company.contact_email}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <time className="text-xs text-muted-foreground hidden md:block">
                    {relativeTime(company.created_at)}
                  </time>
                  <Link
                    href={`/direction/entreprises/${company.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "gap-1 text-xs h-7 px-2",
                    )}
                  >
                    Examiner
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Activité récente */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" />
              Activité récente
            </h2>
            <Link
              href="/direction/audit"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Journal complet
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="rounded-card border border-border bg-card shadow-subtle overflow-hidden divide-y divide-border">
            {MOCK_LOGS.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="relative shrink-0">
                  <div className="flex size-7 items-center justify-center rounded-full bg-muted">
                    <CalendarClock className="size-3.5 text-muted-foreground" />
                  </div>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-1 ring-card",
                      ACTION_DOT[log.action] ?? "bg-muted-foreground",
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-medium text-foreground">
                      {log.actor?.full_name ?? "Système"}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}· {ACTION_LABELS[log.action] ?? log.action}{" "}
                      {TABLE_LABELS[log.entity_table] ?? log.entity_table}
                    </span>
                  </p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {relativeTime(log.created_at)}
                </time>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
