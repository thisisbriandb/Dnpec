import { createClient } from "@/app/lib/supabase/server"
import { InscriptionQueueClient, type InscriptionCompany } from "@/app/direction/_components/inscription-queue-client"

export const dynamic = "force-dynamic"

export default async function InscriptionsPage() {
  const supabase = await createClient()

  const { data: pending } = await supabase
    .from("companies")
    .select(`
      id, nif, rccm, name, contact_email, phone, creation_year,
      size, legal_status, created_at,
      sector:sectors(name),
      profile:profiles!profile_id(full_name, email, created_at)
    `)
    .eq("account_status", "pending")
    .order("created_at", { ascending: true })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-title font-semibold text-foreground">
          Inscriptions en attente
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Traitez les demandes d&apos;inscription dans l&apos;ordre de réception.
        </p>
      </div>
      <InscriptionQueueClient pending={(pending ?? []) as unknown as InscriptionCompany[]} />
    </div>
  )
}
