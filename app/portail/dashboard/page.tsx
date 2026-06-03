import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Megaphone, CheckSquare, Clock, Bell, ArrowRight,
  Building2, CalendarClock,
} from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatDate, formatRelative } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function PortailDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, account_status, nif, sector:sectors(name), size, legal_status")
    .eq("profile_id", user.id)
    .single()

  if (!company || company.account_status !== "validated") redirect("/portail")

  const [targetsRes, submissionsRes, notifsRes] = await Promise.all([
    supabase
      .from("campaign_targets")
      .select("id, status, campaigns(id, title, closes_at, status)")
      .eq("company_id", company.id),
    supabase
      .from("submissions")
      .select("id, status, submitted_at, campaigns(title)")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("notifications")
      .select("id, type, title, body, created_at, read_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
  ])

  type CampRow  = { id: string; title: string; closes_at: string; status: string } | null
  type TitleRow = { title: string } | null

  const allTargets    = targetsRes.data ?? []
  const activeTargets = allTargets.filter(
    (t) => (t.campaigns as unknown as CampRow)?.status === "active",
  )
  const submissions   = submissionsRes.data ?? []
  const notifications = notifsRes.data ?? []

  const pendingSubmissions = submissions.filter(
    (s) => s.status === "submitted" || s.status === "correction_requested",
  ).length

  const sectorName = (company.sector as unknown as { name: string } | null)?.name ?? "—"

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header entreprise */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
          >
            {company.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-display font-semibold text-foreground leading-tight">{company.name}</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">{sectorName} · NIF {company.nif}</p>
          </div>
        </div>
        <StatusBadge status={company.account_status} />
      </div>

      {/* Bandeau campagne active */}
      {activeTargets.length > 0 && (() => {
        const t      = activeTargets[0]
        const camp   = t.campaigns as unknown as CampRow
        if (!camp) return null
        return (
          <div className="flex items-center justify-between gap-4 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Megaphone className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-foreground">{camp.title}</p>
                <p className="text-[11.5px] text-muted-foreground flex items-center gap-1">
                  <CalendarClock className="size-3" />
                  Se termine le {formatDate(camp.closes_at)}
                </p>
              </div>
            </div>
            <Link
              href={`/portail/campagnes/${camp.id}`}
              className="shrink-0 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Répondre
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )
      })()}

      {/* StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Campagnes actives"
          value={activeTargets.length}
          icon={<Megaphone className="size-4" />}
          sparklineColor="info"
        />
        <StatCard
          label="Soumissions en attente"
          value={pendingSubmissions}
          icon={<Clock className="size-4" />}
          sparklineColor="warn"
        />
        <StatCard
          label="Soumissions validées"
          value={submissions.filter((s) => s.status === "validated").length}
          icon={<CheckSquare className="size-4" />}
          sparklineColor="ok"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications récentes */}
        <section className="bg-white rounded-2xl border border-border shadow-subtle overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" />
              <h2 className="text-[13px] font-semibold text-foreground">Notifications récentes</h2>
            </div>
            <Link
              href="/portail/notifications"
              className="text-[12px] text-primary hover:underline flex items-center gap-1"
            >
              Voir tout <ArrowRight className="size-3" />
            </Link>
          </div>

          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Aucune notification"
              description="Vous verrez ici les mises à jour de votre dossier."
              size="sm"
            />
          ) : (
            <ul className="divide-y divide-border/50">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={[
                    "flex items-start gap-3 px-5 py-3 text-[12.5px]",
                    !n.read_at ? "bg-primary/[0.03]" : "",
                  ].join(" ")}
                >
                  {!n.read_at && (
                    <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                  )}
                  <div className={!n.read_at ? "" : "ml-[18px]"}>
                    <p className="font-medium text-foreground leading-snug">{n.title}</p>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{formatRelative(n.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Activité récente */}
        <section className="bg-white rounded-2xl border border-border shadow-subtle overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/60">
            <Building2 className="size-4 text-muted-foreground" />
            <h2 className="text-[13px] font-semibold text-foreground">Activité récente</h2>
          </div>

          {submissions.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="Aucune soumission"
              description="Vos soumissions aux campagnes apparaîtront ici."
              size="sm"
            />
          ) : (
            <ul className="divide-y divide-border/50">
              {submissions.map((s) => {
                const camp = s.campaigns as unknown as TitleRow
                return (
                  <li key={s.id} className="flex items-center justify-between px-5 py-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-foreground truncate">
                        {camp?.title ?? "—"}
                      </p>
                      {s.submitted_at && (
                        <p className="text-[11.5px] text-muted-foreground">
                          {formatDate(s.submitted_at)}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={s.status} />
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
