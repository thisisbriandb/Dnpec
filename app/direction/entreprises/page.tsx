import Link from "next/link"
import { Plus } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { CompaniesTableClient, type TableCompany } from "@/app/direction/_components/companies-table-client"

export const dynamic = "force-dynamic"

export default async function EntreprisesPage() {
  const supabase = await createClient()

  const [{ data: sectors }, { data: companies, count }] = await Promise.all([
    supabase
      .from("sectors")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("companies")
      .select(
        `id, nif, name, account_status, size, legal_status, created_at,
         sector:sectors(id, name),
         validator:profiles!validated_by(full_name)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(0, 24),
  ])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold text-foreground">Répertoire des entreprises</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {count ?? 0} entreprise{(count ?? 0) > 1 ? "s" : ""} enregistrée{(count ?? 0) > 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href="/direction/entreprises/nouveau" />}>
          <Plus className="size-4" />
          Nouvelle entreprise
        </Button>
      </div>

      <CompaniesTableClient
        initialData={(companies ?? []) as unknown as TableCompany[]}
        sectors={sectors ?? []}
        total={count ?? 0}
      />
    </div>
  )
}
