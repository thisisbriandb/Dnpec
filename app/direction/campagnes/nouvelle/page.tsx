import { createClient } from "@/app/lib/supabase/server"
import { CampaignStepperClient } from "@/app/direction/_components/campaign-stepper-client"

export const dynamic = "force-dynamic"

export default async function NouvelleCampagnePage() {
  const supabase = await createClient()

  const [{ data: sectors }, { data: companies }] = await Promise.all([
    supabase
      .from("sectors")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("companies")
      .select("id, nif, name, sector_id")
      .eq("account_status", "validated")
      .order("name")
      .limit(500),
  ])

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-title font-semibold text-foreground">Nouvelle campagne</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configurez la campagne en 4 étapes.
        </p>
      </div>
      <CampaignStepperClient
        sectors={sectors ?? []}
        allCompanies={companies ?? []}
      />
    </div>
  )
}
