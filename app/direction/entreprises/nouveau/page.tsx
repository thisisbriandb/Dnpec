import { createClient } from "@/app/lib/supabase/server"
import { CompanyCreateForm } from "@/app/direction/_components/company-create-form"

export const dynamic = "force-dynamic"

export default async function NouvelleEntreprisePage() {
  const supabase = await createClient()

  const { data: sectors } = await supabase
    .from("sectors")
    .select("id, name")
    .eq("is_active", true)
    .order("name")

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-title font-semibold text-foreground">Nouvelle entreprise</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Création par la Direction — l&apos;entreprise est immédiatement validée.
        </p>
      </div>
      <CompanyCreateForm sectors={sectors ?? []} />
    </div>
  )
}
