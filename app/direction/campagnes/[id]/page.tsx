import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, Users, FileText, Tag } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { CampaignStatusActions } from "@/app/direction/_components/campaign-status-actions"
import { formatDate, formatDateTime } from "@/lib/format"

export const dynamic = "force-dynamic"

const PERIODICITY_LABELS: Record<string, string> = {
  monthly: "Mensuelle",
  quarterly: "Trimestrielle",
  annual: "Annuelle",
  one_off: "Ponctuelle",
}

const TARGET_STATUS_LABELS: Record<string, string> = {
  waiting: "En attente",
  in_progress: "En cours",
  submitted: "Soumis",
  validated: "Validé",
  rejected: "Rejeté",
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: campaign },
    { count: totalTargets },
    { data: targetStats },
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select(`
        id, title, reference_period, periodicity, status, target_mode,
        opens_at, closes_at, sent_at, closed_at, created_at,
        sector:sectors!sector_id(id, name),
        form_version:form_versions!form_version_id(id, version_number)
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("campaign_targets")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", id),
    supabase
      .from("campaign_targets")
      .select("status")
      .eq("campaign_id", id),
  ])

  if (!campaign) notFound()

  const sector = campaign.sector as unknown as { id: string; name: string } | null
  const formVersion = campaign.form_version as unknown as { id: string; version_number: number } | null

  const statusCounts = (targetStats ?? []).reduce<Record<string, number>>((acc, t) => {
    const s = (t as { status: string }).status
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back */}
      <Link
        href="/direction/campagnes"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Campagnes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>{sector?.name ?? "—"}</span>
            <span>·</span>
            <span>{PERIODICITY_LABELS[campaign.periodicity] ?? campaign.periodicity}</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">{campaign.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Période : <span className="font-medium text-foreground">{campaign.reference_period}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={campaign.status} />
          <CampaignStatusActions campaignId={campaign.id} currentStatus={campaign.status} />
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={Calendar}
          label="Ouverture"
          value={campaign.opens_at ? formatDateTime(campaign.opens_at) : "—"}
        />
        <InfoCard
          icon={Calendar}
          label="Clôture"
          value={campaign.closes_at ? formatDateTime(campaign.closes_at) : "—"}
        />
        <InfoCard
          icon={FileText}
          label="Formulaire"
          value={formVersion ? `v${formVersion.version_number}` : "—"}
        />
        <InfoCard
          icon={Tag}
          label="Ciblage"
          value={campaign.target_mode === "sector" ? "Tout le secteur" : "Sélection spécifique"}
        />
      </div>

      {/* Targets summary */}
      <div className="rounded-card border border-border bg-surface shadow-subtle">
        <div className="border-b border-border px-4 py-3 flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Entreprises ciblées
            <span className="ml-2 text-muted-foreground font-normal">
              ({totalTargets ?? 0})
            </span>
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-border">
          {(["waiting", "in_progress", "submitted", "validated", "rejected"] as const).map(
            (s) => (
              <div key={s} className="flex flex-col items-center py-4 gap-1">
                <span className="text-xl font-semibold text-foreground">
                  {statusCounts[s] ?? 0}
                </span>
                <StatusBadge status={s} size="sm" />
                <span className="text-[10px] text-muted-foreground">
                  {TARGET_STATUS_LABELS[s]}
                </span>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-card border border-border bg-surface shadow-subtle px-4 py-3">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <MetaRow label="Créée le" value={formatDate(campaign.created_at)} />
          {campaign.sent_at && (
            <MetaRow label="Activée le" value={formatDateTime(campaign.sent_at)} />
          )}
          {campaign.closed_at && (
            <MetaRow label="Clôturée le" value={formatDateTime(campaign.closed_at)} />
          )}
        </dl>
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-subtle">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted-foreground w-28 shrink-0">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
