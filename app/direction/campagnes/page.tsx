import Link from "next/link"
import { Plus, Megaphone } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { CampagnesTableClient } from "@/app/direction/_components/campagnes-table-client"
import type { CampaignRow } from "@/app/direction/_components/campagnes-table-client"

export const dynamic = "force-dynamic"

export default async function CampagnesPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(`
      id, title, reference_period, periodicity, status, opens_at, closes_at, created_at,
      sector:sectors(name),
      form_version:form_versions(version_number)
    `)
    .order("created_at", { ascending: false })

  const rows = (campaigns ?? []) as unknown as CampaignRow[]

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold text-foreground">Campagnes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} campagne{rows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href="/direction/campagnes/nouvelle" />} nativeButton={false}>
          <Plus className="size-4" />
          Nouvelle campagne
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Aucune campagne"
          description="Créez votre première campagne de collecte de données."
          action={{
            label: "Nouvelle campagne",
            href: "/direction/campagnes/nouvelle",
          }}
          size="lg"
        />
      ) : (
        <CampagnesTableClient data={rows} />
      )}
    </div>
  )
}
