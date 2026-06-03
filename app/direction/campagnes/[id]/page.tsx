import { notFound, redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import { CampaignDetailClient } from "./_components/campaign-detail-client"

export const dynamic = "force-dynamic"

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: campaign }, { data: targets }, { data: submissions }] =
    await Promise.all([
      supabase
        .from("campaigns")
        .select(`
          id, title, reference_period, periodicity, status,
          opens_at, closes_at, target_mode, sent_at, closed_at, created_at,
          sector:sectors!sector_id(id, name, code),
          form_template:form_templates!form_template_id(id, title, description, schema)
        `)
        .eq("id", id)
        .single(),

      supabase
        .from("campaign_targets")
        .select("status")
        .eq("campaign_id", id),

      supabase
        .from("submissions")
        .select(`
          id, status, submitted_at, validated_at, rejection_comment,
          answers, completion_rate,
          company:companies!company_id(
            id, name, nif, rccm, size, legal_status, contact_email, phone, address,
            sigle, nom_dg, region, commune, date_creation, responsable_dnpec,
            activite_nace, capital_social, creation_year,
            sector:sectors!sector_id(name, code)
          )
        `)
        .eq("campaign_id", id)
        .neq("status", "draft")
        .order("submitted_at", { ascending: false, nullsFirst: false }),
    ])

  if (!campaign) notFound()

  return (
    <CampaignDetailClient
      campaign={campaign as unknown as Parameters<typeof CampaignDetailClient>[0]["campaign"]}
      targets={targets ?? []}
      submissions={(submissions ?? []) as unknown as Parameters<typeof CampaignDetailClient>[0]["submissions"]}
    />
  )
}
