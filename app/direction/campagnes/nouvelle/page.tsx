import Link from "next/link"
import { ArrowLeft } from "lucide-react"
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
      .order("name"),
  ])

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back link */}
      <Link
        href="/direction/campagnes"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Campagnes
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Nouvelle campagne</h1>
        <p className="text-sm text-muted-foreground">
          Configurez et lancez une campagne de collecte de données
        </p>
      </div>

      {/* Wizard */}
      <CampaignStepperClient
        sectors={sectors ?? []}
        allCompanies={companies ?? []}
      />
    </div>
  )
}
