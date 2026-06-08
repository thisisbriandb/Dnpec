import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CalendarClock, Clock, ChevronRight } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatDate } from "@/lib/format"
import { CampaignFillClient } from "./_components/campaign-fill-client"
import type { FormSchema } from "@/app/direction/_components/form-fill-preview"

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

export default async function PortailCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: campaignId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("profile_id", user.id)
    .single()
  if (!company) redirect("/portail")

  const { data: target } = await supabase
    .from("campaign_targets")
    .select("id, status")
    .eq("campaign_id", campaignId)
    .eq("company_id", company.id)
    .maybeSingle()
  if (!target) notFound()

  type SectorRow    = { name: string; code: string } | null
  type TemplateRow  = { id: string; title: string; description: string | null; schema: unknown } | null

  const { data: campaign } = await supabase
    .from("campaigns")
    .select(`
      id, title, reference_period, periodicity, status,
      opens_at, closes_at,
      sectors!sector_id(name, code),
      form_templates!form_template_id(id, title, description, schema)
    `)
    .eq("id", campaignId)
    .single()
  if (!campaign) notFound()

  const sector   = campaign.sectors   as unknown as SectorRow
  const template = campaign.form_templates as unknown as TemplateRow
  if (!template) notFound()

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, status, submitted_at, rejection_comment, answers")
    .eq("campaign_id", campaignId)
    .eq("company_id", company.id)
    .maybeSingle()

  const initialAnswers: Record<string, string | string[]> =
    (submission?.answers as Record<string, string | string[]> | null) ?? {}

  const campaignClosed = campaign.status !== "active"
  const days = campaign.closes_at ? daysUntil(campaign.closes_at) : null
  const isUrgent = days !== null && days <= 3 && days >= 0 && !campaignClosed

  return (
    <div className="p-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <Link
          href="/portail/campagnes"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Mes campagnes
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium truncate max-w-[240px]">{campaign.title}</span>
      </div>

      {/* Header campagne */}
      <div className="relative rounded-2xl border border-border bg-card shadow-subtle overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(30,58,95,0.04) 0%, transparent 55%)" }}
        />
        <div className="relative px-6 py-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground leading-tight">
                  {campaign.title}
                </h1>
                <StatusBadge status={campaign.status} />
                {submission && <StatusBadge status={submission.status} />}
              </div>
              <p className="text-[12.5px] text-muted-foreground">
                {sector?.name ?? "—"} · {PERIODICITY_LABELS[campaign.periodicity] ?? campaign.periodicity} · Période : {campaign.reference_period}
              </p>
            </div>
            {isUrgent && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-status-bad-bg border border-status-bad/25 px-3 py-1 text-[11.5px] font-semibold text-status-bad-text">
                <Clock className="size-3" />
                {days === 0 ? "Dernier jour !" : `J-${days}`}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-5 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5" />
              Ouverture : {formatDate(campaign.opens_at)}
            </span>
            {campaign.closes_at && (
              <span className="flex items-center gap-1.5">
                <CalendarClock className="size-3.5" />
                Clôture : {formatDate(campaign.closes_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire interactif */}
      <CampaignFillClient
        campaignId={campaignId}
        submissionId={submission?.id ?? null}
        submissionStatus={(submission?.status ?? null) as Parameters<typeof CampaignFillClient>[0]["submissionStatus"]}
        rejectionComment={submission?.rejection_comment ?? null}
        formTitle={template.title}
        formDescription={template.description}
        schema={template.schema as FormSchema}
        initialAnswers={initialAnswers}
        campaignClosed={campaignClosed}
      />
    </div>
  )
}
