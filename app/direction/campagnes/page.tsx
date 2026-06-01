import Link from "next/link"
import { Plus } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { CampagnesTableClient } from "@/app/direction/_components/campagnes-table-client"
import type { CampaignRow } from "@/app/direction/_components/campagnes-table-client"

export const dynamic = "force-dynamic"

export default async function CampagnesPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(`
      id, title, reference_period, periodicity, status,
      opens_at, closes_at, created_at,
      sector:sectors!sector_id(name),
      form_version:form_versions!form_version_id(version_number)
    `)
    .order("created_at", { ascending: false })

  const rows = (campaigns ?? []) as unknown as CampaignRow[]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Campagnes</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les campagnes de collecte de données
          </p>
        </div>
        <Link href="/direction/campagnes/nouvelle" className={buttonVariants({ size: "sm" })}>
          <Plus className="size-3.5" />
          Nouvelle campagne
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-card border border-border bg-surface shadow-subtle">
        <CampagnesTableClient data={rows} />
      </div>
    </div>
  )
}
