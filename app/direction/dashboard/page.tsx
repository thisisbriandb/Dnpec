import { Building2, Clock, Megaphone, CheckSquare, Activity } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { formatRelative, formatDate } from "@/lib/format"

export const dynamic = "force-dynamic"

const ACTION_LABELS: Record<string, string> = {
  insert: "Créé",
  update: "Modifié",
  delete: "Supprimé",
}

const TABLE_LABELS: Record<string, string> = {
  companies: "Entreprise",
  campaigns: "Campagne",
  submissions: "Soumission",
  form_versions: "Formulaire",
  campaign_targets: "Cible",
}

type AuditLog = {
  id: string
  action: string
  entity_table: string
  entity_id: string | null
  created_at: string
  actor: { full_name: string; role: string } | null
}

export default async function DirectionDashboardPage() {
  const supabase = await createClient()

  const [
    { count: validatedCompanies },
    { count: pendingCompanies },
    { count: activeCampaigns },
    { count: pendingSubmissions },
    { data: recentLogs },
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("account_status", "validated"),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("account_status", "pending"),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("audit_logs")
      .select("id, action, entity_table, entity_id, created_at, actor:profiles!actor_id(full_name, role)")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-title font-semibold text-foreground">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue globale de la plateforme au {formatDate(new Date())}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Entreprises validées"
          value={validatedCompanies ?? 0}
          icon={<Building2 className="size-4" />}
        />
        <StatCard
          label="Inscriptions en attente"
          value={pendingCompanies ?? 0}
          icon={<Clock className="size-4" />}
          sparklineColor={pendingCompanies ? "warn" : "ok"}
        />
        <StatCard
          label="Campagnes actives"
          value={activeCampaigns ?? 0}
          icon={<Megaphone className="size-4" />}
          sparklineColor="ok"
        />
        <StatCard
          label="Soumissions à valider"
          value={pendingSubmissions ?? 0}
          icon={<CheckSquare className="size-4" />}
          sparklineColor={pendingSubmissions ? "info" : "ok"}
        />
      </div>

      {/* Activity feed */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          Activité récente
        </h2>
        {!recentLogs || recentLogs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Aucune activité"
            description="Les actions des utilisateurs apparaîtront ici."
            size="sm"
          />
        ) : (
          <div className="rounded-card border border-border bg-surface shadow-subtle divide-y divide-border">
            {(recentLogs as unknown as AuditLog[]).map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Activity className="size-3 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{log.actor?.full_name ?? "Système"}</span>
                    {" · "}
                    <span className="text-muted-foreground">
                      {ACTION_LABELS[log.action] ?? log.action}
                      {" "}
                      {TABLE_LABELS[log.entity_table] ?? log.entity_table}
                    </span>
                  </p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {formatRelative(log.created_at)}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
