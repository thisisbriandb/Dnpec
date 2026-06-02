import { createClient } from "@/app/lib/supabase/server"
import { CompanyCreateForm } from "@/app/direction/_components/company-create-form"

export const dynamic = "force-dynamic"

export default async function NouvelleEntreprisePage() {
  const supabase = await createClient()

  const { data: sectors } = await supabase
    .from("sectors")
    .select("id, name, code")
    .eq("is_active", true)
    .order("name")

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary font-mono mb-1">
          Entreprises · Nouvelle fiche
        </p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Enregistrer une entreprise
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Création par la Direction — l&apos;entreprise est immédiatement validée, sans compte utilisateur associé.
        </p>
      </div>
      <CompanyCreateForm sectors={sectors ?? []} />
    </div>
  )
}
