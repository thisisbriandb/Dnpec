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
import { createClient }    from "@/app/lib/supabase/server"
import { StatCard }        from "@/components/ui/stat-card"
import { EmptyState }      from "@/components/ui/empty-state"
import { Badge }           from "@/components/ui/badge"
import { buttonVariants }  from "@/components/ui/button"
import { formatDate }      from "@/lib/format"
import { cn }              from "@/lib/utils"
import { CampaignSidepanel }                    from "@/app/direction/_components/campaign-sidepanel"
import { SubmissionDonutChart, SectorBarChart } from "@/app/direction/_components/dashboard-charts"

export const dynamic = "force-dynamic"

/* ── Constants ──────────────────────────────────────────────── */
const ACTION_LABELS: Record<string, string> = {
  insert: "Créé",
  update: "Modifié",
  delete: "Supprimé",
}
const TABLE_LABELS: Record<string, string> = {
  companies:         "Entreprise",
  campaigns:         "Campagne",
  submissions:       "Soumission",
  form_versions:     "Formulaire",
  campaign_targets:  "Cible",
  company_documents: "Document",
}
const ACTION_DOT: Record<string, string> = {
  insert: "bg-status-ok",
  update: "bg-status-info",
  delete: "bg-status-bad",
}

const SECTOR_COLORS: Record<string, string> = {
  Mines:     "#f59e0b",
  Finances:  "#3b82f6",
  Commerce:  "#ea580c",
  Industrie: "#7c3aed",
  Energie:   "#16a34a",
}
const SUBMISSION_COLORS: Record<string, string> = {
  validated:            "#22c55e",
  submitted:            "#3b82f6",
  correction_requested: "#f59e0b",
  rejected:             "#ef4444",
  draft:                "#d1d5db",
}
const SUBMISSION_LABELS: Record<string, string> = {
  validated:            "Validées",
  submitted:            "Soumises",
  correction_requested: "Correction dem.",
  rejected:             "Rejetées",
  draft:                "Brouillons",
}
// Display order for the donut legend
const SUBMISSION_ORDER = ["validated", "submitted", "correction_requested", "rejected", "draft"]

/* ── Types ──────────────────────────────────────────────────── */
type CompanyRow = {
  id: string
  account_status: string
  sector: { name: string } | null
}
type CampaignRow = {
  id: string
  title: string
  reference_period: string
  periodicity: string
  closes_at: string
  sector: { name: string } | null
  targets: { id: string; status: string }[]
}
type PendingRow = {
  id: string
  name: string
  contact_email: string
  created_at: string
  sector: { name: string } | null
}
type AuditRow = {
  id: string
  action: string
  entity_table: string
  created_at: string
  actor: { full_name: string } | null
}

/* ── Helper ─────────────────────────────────────────────────── */
function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)    return "à l'instant"
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

/* ── Page ───────────────────────────────────────────────────── */
export default async function DirectionDashboardPage() {
  const supabase = await createClient()

  const [
    { data: companiesRaw },
    { data: activeCampaignsRaw },
    { count: scheduledCount },
    { data: submissionsRaw },
    { data: pendingQueueRaw },
    { data: recentLogsRaw },
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id, account_status, sector:sectors(name)"),

    supabase
      .from("campaigns")
      .select(
        "id, title, reference_period, periodicity, closes_at, sector:sectors(name), targets:campaign_targets(id, status)",
      )
      .eq("status", "active")
      .order("closes_at")
      .limit(8),

    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled"),

    supabase.from("submissions").select("id, status"),

    supabase
      .from("companies")
      .select("id, name, contact_email, created_at, sector:sectors(name)")
      .eq("account_status", "pending")
      .order("created_at")
      .limit(5),

    supabase
      .from("audit_logs")
      .select("id, action, entity_table, created_at, actor:profiles!actor_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(7),
  ])

  /* ── Derived: companies ─────────────────────── */
  const companies     = (companiesRaw ?? []) as unknown as CompanyRow[]
  const validatedCount  = companies.filter((c) => c.account_status === "validated").length
  const pendingCount    = companies.filter((c) => c.account_status === "pending").length
  const rejectedCount   = companies.filter((c) => c.account_status === "rejected").length
  const suspendedCount  = companies.filter((c) => c.account_status === "suspended").length
  const totalCount      = companies.length

  // Sector bar chart data (validated only)
  const sectorMap = new Map<string, number>()
  for (const c of companies.filter((c) => c.account_status === "validated")) {
    const name = c.sector?.name ?? "—"
    sectorMap.set(name, (sectorMap.get(name) ?? 0) + 1)
  }
  const sectorBarData = Array.from(sectorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count, color: SECTOR_COLORS[name] ?? "#6b7280" }))

  /* ── Derived: campaigns ─────────────────────── */
  const activeCampaigns = (activeCampaignsRaw ?? []) as unknown as CampaignRow[]

  let totalTargets     = 0
  let respondedTargets = 0
  for (const c of activeCampaigns) {
    totalTargets     += c.targets.length
    respondedTargets += c.targets.filter(
      (t) => t.status === "submitted" || t.status === "validated",
    ).length
  }
  const responseRate = totalTargets > 0
    ? Math.round((respondedTargets / totalTargets) * 100)
    : null

  /* ── Derived: submissions ───────────────────── */
  const submissions = submissionsRaw ?? []
  const subCounts: Record<string, number> = {}
  for (const s of submissions) {
    subCounts[s.status] = (subCounts[s.status] ?? 0) + 1
  }
  const totalSubmissions = submissions.length
  const toValidate       = subCounts["submitted"] ?? 0

  // Donut chart data — ordered and filtered
  const submissionDonutData = SUBMISSION_ORDER
    .filter((key) => (subCounts[key] ?? 0) > 0)
    .map((key) => ({
      name:  SUBMISSION_LABELS[key] ?? key,
      value: subCounts[key],
      color: SUBMISSION_COLORS[key] ?? "#9ca3af",
    }))

  /* ── Derived: others ────────────────────────── */
  const pendingQueue = (pendingQueueRaw ?? []) as unknown as PendingRow[]
  const recentLogs   = (recentLogsRaw  ?? []) as unknown as AuditRow[]

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <div className="min-h-full bg-muted/30 p-6 space-y-6">

      {/* ── Header ────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-title font-semibold text-foreground">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue globale de la plateforme · {formatDate(new Date())}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {pendingCount > 0 && (
            <Link
              href="/direction/entreprises/inscriptions"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
            >
              <AlertTriangle className="size-3.5" />
              {pendingCount} inscription{pendingCount > 1 ? "s" : ""} en attente
            </Link>
          )}
          {toValidate > 0 && (
            <Link
              href="/direction/validations"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
            >
              <CheckSquare className="size-3.5" />
              {toValidate} à valider
            </Link>
          )}
        </div>
      </div>

      {/* ── KPI Row ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Entreprises validées"
          value={validatedCount}
          icon={<Building2 className="size-4" />}
          sparklineColor="ok"
          deltaLabel={totalCount > 0 ? `sur ${totalCount} inscrites` : undefined}
        />
        <StatCard
          label="Inscriptions en attente"
          value={pendingCount}
          icon={<Clock className="size-4" />}
          sparklineColor={pendingCount > 0 ? "warn" : "ok"}
          deltaLabel={
            rejectedCount + suspendedCount > 0
              ? `${rejectedCount + suspendedCount} inactive${rejectedCount + suspendedCount > 1 ? "s" : ""}`
              : undefined
          }
        />
        <StatCard
          label="Campagnes actives"
          value={activeCampaigns.length}
          icon={<Megaphone className="size-4" />}
          sparklineColor="ok"
          deltaLabel={
            (scheduledCount ?? 0) > 0
              ? `+ ${scheduledCount} planifiée${(scheduledCount ?? 0) > 1 ? "s" : ""}`
              : totalTargets > 0
                ? `${totalTargets} entreprises ciblées`
                : undefined
          }
        />
        <StatCard
          label="Taux de réponse"
          value={responseRate != null ? `${responseRate} %` : "—"}
          icon={<TrendingUp className="size-4" />}
          sparklineColor={
            responseRate == null ? "info"
            : responseRate >= 80 ? "ok"
            : responseRate >= 50 ? "warn"
            : "bad"
          }
          deltaLabel={
            responseRate != null
              ? `${respondedTargets} / ${totalTargets} soumis`
              : "Aucune campagne active"
          }
        />
        <StatCard
          label="Soumissions à valider"
          value={toValidate}
          icon={<CheckSquare className="size-4" />}
          sparklineColor={toValidate > 0 ? "info" : "ok"}
          deltaLabel={
            totalSubmissions > 0
              ? `sur ${totalSubmissions} soumission${totalSubmissions > 1 ? "s" : ""}`
              : undefined
          }
        />
      </div>

      {/* ── Campagnes — sidepanel interactif ──────── */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Megaphone className="size-4 text-muted-foreground" />
            Campagnes actives
            {activeCampaigns.length > 0 && (
              <Badge variant="secondary">{activeCampaigns.length}</Badge>
            )}
          </h2>
          <Link
            href="/direction/campagnes"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            Toutes les campagnes
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {activeCampaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Aucune campagne active"
            description="Lancez une campagne de collecte pour voir sa progression ici."
            size="sm"
          />
        ) : (
          <CampaignSidepanel campaigns={activeCampaigns} />
        )}
      </section>

      {/* ── Graphiques : donut + barre horizontale ─── */}
      {(totalSubmissions > 0 || sectorBarData.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {totalSubmissions > 0 ? (
            <SubmissionDonutChart
              data={submissionDonutData}
              total={totalSubmissions}
            />
          ) : (
            <div className="rounded-card border border-border bg-card shadow-subtle p-5 flex items-center justify-center min-h-48">
              <p className="text-sm text-muted-foreground">Aucune soumission enregistrée</p>
            </div>
          )}

          {sectorBarData.length > 0 ? (
            <SectorBarChart data={sectorBarData} />
          ) : (
            <div className="rounded-card border border-border bg-card shadow-subtle p-5 flex items-center justify-center min-h-48">
              <p className="text-sm text-muted-foreground">Aucune entreprise validée</p>
            </div>
          )}
        </div>
      )}

      {/* ── Bas de page : inscriptions + activité ──── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-start">

        {/* Inscriptions en attente */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              Inscriptions en attente
              {pendingCount > 0 && (
                <Badge variant="secondary">{pendingCount}</Badge>
              )}
            </h2>
            {pendingCount > 0 && (
              <Link
                href="/direction/entreprises/inscriptions"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                Tout traiter
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>

          {pendingQueue.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="File vide"
              description="Aucune inscription en attente de validation."
              size="sm"
            />
          ) : (
            <div className="rounded-card border border-border bg-card shadow-subtle overflow-hidden divide-y divide-border">
              {pendingQueue.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                >
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
          )}
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

          {recentLogs.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="Aucune activité"
              description="Les actions des utilisateurs apparaîtront ici."
              size="sm"
            />
          ) : (
            <div className="rounded-card border border-border bg-card shadow-subtle overflow-hidden divide-y divide-border">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                >
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
          )}
        </section>

      </div>
    </div>
  )
}
