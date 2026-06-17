import {
  Building2,
  Clock,
  Megaphone,
  CheckSquare,
  Activity,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Gauge,
  Timer,
  PlusCircle,
  BarChart3,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { createClient }    from "@/app/lib/supabase/server"
import { EmptyState }      from "@/components/ui/empty-state"
import { Badge }           from "@/components/ui/badge"
import { buttonVariants }  from "@/components/ui/button"
import { formatDate }      from "@/lib/format"
import { cn }              from "@/lib/utils"
import { KpiCard }                from "@/app/direction/_components/kpi-card"
import {
  SectorBarChart,
  CompanySizeDonut,
  SubmissionTrendChart,
} from "@/app/direction/_components/dashboard-charts"

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
// Display order for the "Statuts" card
const SUBMISSION_ORDER = ["validated", "submitted", "correction_requested", "rejected", "draft"]

const SIZE_LABELS: Record<string, string> = {
  grande_entreprise: "GE",
  pme:                "PME",
  tpe:                "TPE",
}
const SIZE_COLORS: Record<string, string> = {
  grande_entreprise: "#16A34A",
  pme:                "#2563EB",
  tpe:                "#F59E0B",
}
const SIZE_ORDER = ["grande_entreprise", "pme", "tpe"]

/* ── Types ──────────────────────────────────────────────────── */
type CompanyRow = {
  id: string
  account_status: string
  size: string
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
type SubmissionRow = {
  id: string
  status: string
  submitted_at: string | null
  validated_at: string | null
  created_at: string
  completion_rate: number | null
  campaign: { sector: { name: string } | null } | null
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
      .select("id, account_status, size, sector:sectors(name)"),

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

    supabase
      .from("submissions")
      .select(
        "id, status, submitted_at, validated_at, created_at, completion_rate, campaign:campaigns(sector:sectors(name))",
      ),

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

  // Répartition par taille (entreprises validées)
  const sizeMap = new Map<string, number>()
  for (const c of companies.filter((c) => c.account_status === "validated")) {
    sizeMap.set(c.size, (sizeMap.get(c.size) ?? 0) + 1)
  }
  const totalValidatedWithSize = Array.from(sizeMap.values()).reduce((a, b) => a + b, 0)
  const companySizeData = SIZE_ORDER
    .filter((key) => (sizeMap.get(key) ?? 0) > 0)
    .map((key) => ({
      name:  SIZE_LABELS[key] ?? key,
      value: sizeMap.get(key) ?? 0,
      color: SIZE_COLORS[key] ?? "#6b7280",
    }))

  /* ── Derived: campaigns ─────────────────────── */
  const activeCampaigns = (activeCampaignsRaw ?? []) as unknown as CampaignRow[]

  let totalTargets = 0
  for (const c of activeCampaigns) {
    totalTargets += c.targets.length
  }

  /* ── Derived: submissions ───────────────────── */
  const submissions = (submissionsRaw ?? []) as unknown as SubmissionRow[]
  const subCounts: Record<string, number> = {}
  for (const s of submissions) {
    subCounts[s.status] = (subCounts[s.status] ?? 0) + 1
  }
  const totalSubmissions = submissions.length
  const toValidate       = subCounts["submitted"] ?? 0

  // Carte "Statuts" — comptage par statut
  const statusList = SUBMISSION_ORDER
    .filter((key) => (subCounts[key] ?? 0) > 0)
    .map((key) => ({
      key,
      label: SUBMISSION_LABELS[key] ?? key,
      value: subCounts[key],
      color: SUBMISSION_COLORS[key] ?? "#9ca3af",
    }))

  // Soumissions par secteur
  const sectorSubMap = new Map<string, number>()
  for (const s of submissions) {
    const name = s.campaign?.sector?.name ?? "—"
    sectorSubMap.set(name, (sectorSubMap.get(name) ?? 0) + 1)
  }
  const sectorBarData = Array.from(sectorSubMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count, color: SECTOR_COLORS[name] ?? "#6b7280" }))

  // Tendance des soumissions (6 derniers mois)
  const now = new Date()
  const monthBuckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: label.charAt(0).toUpperCase() + label.slice(1) }
  })
  const trendMap = new Map(monthBuckets.map((m) => [m.key, { validated: 0, pending: 0 }]))
  for (const s of submissions) {
    if (s.status === "draft") continue
    const d = new Date(s.submitted_at ?? s.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = trendMap.get(key)
    if (!bucket) continue
    if (s.status === "validated") bucket.validated += 1
    else bucket.pending += 1
  }
  const trendData = monthBuckets.map((m) => ({ month: m.label, ...trendMap.get(m.key)! }))

  // Complétude globale (moyenne du taux de complétion des formulaires)
  const avgCompletion = totalSubmissions > 0
    ? Math.round(submissions.reduce((sum, s) => sum + (s.completion_rate ?? 0), 0) / totalSubmissions)
    : null

  // Délai moyen de traitement (soumission → validation)
  const processedSubmissions = submissions.filter((s) => s.submitted_at && s.validated_at)
  const avgProcessingDays = processedSubmissions.length > 0
    ? processedSubmissions.reduce(
        (sum, s) => sum + (new Date(s.validated_at!).getTime() - new Date(s.submitted_at!).getTime()),
        0,
      ) / processedSubmissions.length / 86_400_000
    : null

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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label="Entreprises validées"
          value={validatedCount}
          icon={<Building2 className="size-4" />}
          accent="ok"
          href="/direction/entreprises"
          changeLabel={totalCount > 0 ? `sur ${totalCount} inscrites` : undefined}
        />
        <KpiCard
          label="Inscriptions en attente"
          value={pendingCount}
          icon={<Clock className="size-4" />}
          accent="warn"
          href="/direction/entreprises/inscriptions"
          changeLabel={
            pendingCount > 0
              ? "À traiter dès maintenant"
              : rejectedCount + suspendedCount > 0
                ? `${rejectedCount + suspendedCount} inactive${rejectedCount + suspendedCount > 1 ? "s" : ""}`
                : undefined
          }
        />
        <KpiCard
          label="Soumissions à valider"
          value={toValidate}
          icon={<CheckSquare className="size-4" />}
          accent="info"
          href="/direction/validations"
          changeLabel={
            totalSubmissions > 0
              ? `sur ${totalSubmissions} soumission${totalSubmissions > 1 ? "s" : ""}`
              : undefined
          }
        />
        <KpiCard
          label="Campagnes actives"
          value={activeCampaigns.length}
          icon={<Megaphone className="size-4" />}
          accent="gray"
          href="/direction/campagnes"
          changeLabel={
            (scheduledCount ?? 0) > 0
              ? `+ ${scheduledCount} planifiée${(scheduledCount ?? 0) > 1 ? "s" : ""}`
              : totalTargets > 0
                ? `${totalTargets} entreprises ciblées`
                : undefined
          }
        />
        <KpiCard
          label="Complétude globale"
          value={avgCompletion != null ? `${avgCompletion} %` : "—"}
          icon={<Gauge className="size-4" />}
          accent="purple"
          progressPct={avgCompletion ?? 0}
          changeLabel={
            totalSubmissions > 0
              ? `Moyenne sur ${totalSubmissions} soumission${totalSubmissions > 1 ? "s" : ""}`
              : "Aucune soumission"
          }
        />
        <KpiCard
          label="Délai moy. traitement"
          value={avgProcessingDays != null ? `${avgProcessingDays.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} j` : "—"}
          icon={<Timer className="size-4" />}
          accent="info"
          changeLabel={
            processedSubmissions.length > 0
              ? `Sur ${processedSubmissions.length} soumission${processedSubmissions.length > 1 ? "s" : ""} validée${processedSubmissions.length > 1 ? "s" : ""}`
              : "Aucune soumission validée"
          }
        />
      </div>

      {/* ── Ligne 2 : Soumissions par secteur + Statuts + Actions rapides ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px_240px]">
        {sectorBarData.length > 0 ? (
          <SectorBarChart data={sectorBarData} />
        ) : (
          <div className="h-full rounded-card border border-border bg-card shadow-subtle p-5 flex items-center justify-center min-h-48">
            <p className="text-sm text-muted-foreground">Aucune soumission enregistrée</p>
          </div>
        )}

        {/* Statuts */}
        <div className="h-full rounded-card border border-border bg-card shadow-subtle p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="size-4 text-muted-foreground" />
            Statuts
          </h2>
          {statusList.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune soumission</p>
          ) : (
            <div className="flex flex-col gap-2">
              {statusList.map(({ key, label, value, color }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5"
                  style={{ background: color + "18" }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs font-medium truncate" style={{ color }}>{label}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums shrink-0" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="h-full rounded-card border border-border bg-card shadow-subtle p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap className="size-4 text-muted-foreground" />
            Actions rapides
          </h2>
          <div className="flex flex-col gap-2">
            <Link
              href="/direction/entreprises/nouveau"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "justify-start gap-2.5 w-full")}
            >
              <PlusCircle className="size-3.5" />
              Nouvelle inscription
            </Link>
            <Link
              href="/direction/campagnes/nouvelle"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "justify-start gap-2.5 w-full")}
            >
              <Megaphone className="size-3.5" />
              Nouvelle campagne
            </Link>
            <Link
              href="/direction/validations"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "justify-start gap-2.5 w-full text-status-info border-status-info/30")}
            >
              <CheckSquare className="size-3.5" />
              Valider soumissions
            </Link>
            <Link
              href="/direction/analyses"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "justify-start gap-2.5 w-full")}
            >
              <TrendingUp className="size-3.5" />
              Voir les analyses
            </Link>
          </div>
        </div>
      </div>

      {/* ── Ligne 2b : Tendance + Taille des entreprises + Activité récente ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px_280px]">
        <SubmissionTrendChart data={trendData} />

        {companySizeData.length > 0 ? (
          <CompanySizeDonut data={companySizeData} total={totalValidatedWithSize} />
        ) : (
          <div className="h-full rounded-card border border-border bg-card shadow-subtle p-5 flex items-center justify-center min-h-48">
            <p className="text-sm text-muted-foreground">Aucune entreprise validée</p>
          </div>
        )}

        {/* Activité récente */}
        <section className="h-[400px] rounded-card border border-border bg-card shadow-subtle overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border shrink-0">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" />
              Activité récente
            </h2>
          </div>
          {recentLogs.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Activity}
                title="Aucune activité"
                description="Les actions des utilisateurs apparaîtront ici."
                size="sm"
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 px-4 py-2.5">
                  <span
                    className={cn("mt-1.5 size-1.5 rounded-full shrink-0", ACTION_DOT[log.action] ?? "bg-muted-foreground")}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug">
                      <span className="font-medium text-foreground">
                        {log.actor?.full_name ?? "Système"}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}· {ACTION_LABELS[log.action] ?? log.action}{" "}
                        {TABLE_LABELS[log.entity_table] ?? log.entity_table}
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      {relativeTime(log.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Inscriptions en attente ─────────────────── */}
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
    </div>
  )
}
