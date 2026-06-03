import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Megaphone, CalendarClock, Clock, CheckCircle2,
  ChevronRight, History,
} from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/format"

export const dynamic = "force-dynamic"

const PERIODICITY_LABELS: Record<string, string> = {
  monthly:   "Mensuelle",
  quarterly: "Trimestrielle",
  annual:    "Annuelle",
  one_off:   "Ponctuelle",
}

function daysUntil(dateStr: string): number {
  return Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
}

type SubmissionStatus = "draft" | "submitted" | "validated" | "rejected" | "correction_requested"
type CampaignStatus   = "draft" | "scheduled" | "active" | "closed" | "archived"

interface CampaignRow {
  campaignId:       string
  title:            string
  sectorName:       string
  periodicity:      string
  referencePeriod:  string
  campaignStatus:   CampaignStatus
  closesAt:         string | null
  submission:       { id: string; status: SubmissionStatus; submittedAt: string | null } | null
}

export default async function PortailCampagnesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("profile_id", user.id)
    .single()
  if (!company) redirect("/portail")

  type TargetRaw = {
    id: string
    campaigns: {
      id: string
      title: string
      reference_period: string
      periodicity: string
      status: string
      closes_at: string | null
      sectors: { name: string } | null
    } | null
  }

  const [targetsRes, submissionsRes] = await Promise.all([
    supabase
      .from("campaign_targets")
      .select(`
        id,
        campaigns!campaign_id(
          id, title, reference_period, periodicity, status, closes_at,
          sectors!sector_id(name)
        )
      `)
      .eq("company_id", company.id),
    supabase
      .from("submissions")
      .select("id, campaign_id, status, submitted_at")
      .eq("company_id", company.id),
  ])

  const targets     = (targetsRes.data ?? []) as unknown as TargetRaw[]
  const submissions = submissionsRes.data ?? []

  const subMap = new Map(submissions.map((s) => [
    s.campaign_id,
    { id: s.id, status: s.status as SubmissionStatus, submittedAt: s.submitted_at },
  ]))

  const rows: CampaignRow[] = targets
    .filter((t) => t.campaigns)
    .map((t) => {
      const c = t.campaigns!
      return {
        campaignId:      c.id,
        title:           c.title,
        sectorName:      c.sectors?.name ?? "—",
        periodicity:     c.periodicity,
        referencePeriod: c.reference_period,
        campaignStatus:  c.status as CampaignStatus,
        closesAt:        c.closes_at,
        submission:      subMap.get(c.id) ?? null,
      }
    })

  const active  = rows.filter((r) => r.campaignStatus === "active")
    .sort((a, b) => {
      if (!a.closesAt) return 1
      if (!b.closesAt) return -1
      return new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime()
    })

  const history = rows.filter((r) => r.campaignStatus === "closed" || r.campaignStatus === "archived")
    .sort((a, b) => {
      if (!a.closesAt) return 1
      if (!b.closesAt) return -1
      return new Date(b.closesAt).getTime() - new Date(a.closesAt).getTime()
    })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-display font-semibold text-foreground">Mes campagnes</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Demandes de collecte de données adressées à votre entreprise.
          </p>
        </div>
        {active.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[12px] font-semibold text-primary">
            <Megaphone className="size-3.5" />
            {active.length} active{active.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-subtle">
          <EmptyState
            icon={Megaphone}
            title="Aucune campagne"
            description="Aucune campagne de collecte ne vous a encore été adressée."
            size="md"
          />
        </div>
      ) : (
        <>
          {/* Campagnes actives */}
          {active.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
                  <Megaphone className="size-3.5 text-primary" />
                </div>
                <h2 className="text-[13px] font-semibold text-foreground">Campagnes actives</h2>
                <span className="text-[11px] text-muted-foreground">
                  ({active.length})
                </span>
              </div>

              <div className="space-y-3">
                {active.map((row) => {
                  const days = row.closesAt ? daysUntil(row.closesAt) : null
                  const isUrgent = days !== null && days <= 3 && days >= 0
                  const isDone = row.submission?.status === "submitted" || row.submission?.status === "validated"

                  return (
                    <div
                      key={row.campaignId}
                      className="rounded-2xl border border-border bg-card shadow-subtle overflow-hidden"
                    >
                      <div
                        className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
                        aria-hidden="true"
                      />
                      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[14px] font-semibold text-foreground leading-tight">
                              {row.title}
                            </h3>
                            {row.submission && (
                              <StatusBadge status={row.submission.status} size="sm" />
                            )}
                            {isUrgent && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-status-bad-bg border border-status-bad/20 px-2 py-0.5 text-[10.5px] font-semibold text-status-bad-text">
                                <Clock className="size-2.5" />
                                {days === 0 ? "Dernier jour" : `J-${days}`}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
                            <span>{row.sectorName}</span>
                            <span>·</span>
                            <span>{PERIODICITY_LABELS[row.periodicity] ?? row.periodicity}</span>
                            <span>·</span>
                            <span>Période : {row.referencePeriod}</span>
                          </div>
                          {row.closesAt && (
                            <p className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                              <CalendarClock className="size-3" />
                              Clôture le {formatDate(row.closesAt)}
                            </p>
                          )}
                        </div>

                        <Link
                          href={`/portail/campagnes/${row.campaignId}`}
                          className={
                            isDone
                              ? "shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              : "shrink-0 flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                          }
                        >
                          {isDone ? (
                            <>
                              <CheckCircle2 className="size-3.5" />
                              Voir la réponse
                            </>
                          ) : (
                            <>
                              Répondre
                              <ChevronRight className="size-3.5" />
                            </>
                          )}
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Historique */}
          {history.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md bg-muted/60">
                  <History className="size-3.5 text-muted-foreground" />
                </div>
                <h2 className="text-[13px] font-semibold text-foreground">Historique</h2>
                <span className="text-[11px] text-muted-foreground">({history.length})</span>
              </div>

              <div className="rounded-2xl border border-border bg-card shadow-subtle overflow-hidden divide-y divide-border/50">
                {history.map((row) => (
                  <Link
                    key={row.campaignId}
                    href={`/portail/campagnes/${row.campaignId}`}
                    className="flex items-center justify-between px-5 py-3.5 gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-[13px] font-medium text-foreground truncate">{row.title}</p>
                      <p className="text-[11.5px] text-muted-foreground">
                        {row.sectorName} · {row.referencePeriod}
                        {row.closesAt && ` · Clôturée le ${formatDate(row.closesAt)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {row.submission ? (
                        <StatusBadge status={row.submission.status} size="sm" />
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60">Non répondu</span>
                      )}
                      <ChevronRight className="size-3.5 text-muted-foreground/40" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
