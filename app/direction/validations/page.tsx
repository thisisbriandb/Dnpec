import { redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import { ValidationsQueueClient, type QueueSubmission } from "@/app/direction/_components/validations-queue-client"

export const dynamic = "force-dynamic"

export default async function ValidationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: submissions } = await supabase
    .from("submissions")
    .select(`
      id, status, submitted_at, validated_at, rejection_comment,
      answers, completion_rate,
      campaign:campaigns!campaign_id(
        id, title, reference_period, closes_at,
        sector:sectors!sector_id(name, code),
        form_template:form_templates!form_template_id(id, title, schema)
      ),
      company:companies!company_id(
        id, name, nif, rccm, size, legal_status, contact_email, phone, address,
        sigle, nom_dg, region, commune, date_creation, responsable_dnpec,
        activite_nace, capital_social, creation_year,
        sector:sectors!sector_id(name, code)
      )
    `)
    .neq("status", "draft")
    .order("submitted_at", { ascending: true, nullsFirst: false })

  return (
    <ValidationsQueueClient submissions={(submissions ?? []) as unknown as QueueSubmission[]} />
  )
}
