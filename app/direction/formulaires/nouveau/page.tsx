import { notFound, redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import { SchemaEditorClient } from "@/app/direction/_components/schema-editor-client"

export const dynamic = "force-dynamic"

export default async function NouveauFormulairePage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string }>
}) {
  const { sector: sectorId } = await searchParams

  if (!sectorId) notFound()

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "super_admin" && profile?.role !== "analyste") {
    redirect("/direction/formulaires")
  }

  const { data: sector } = await supabase
    .from("sectors")
    .select("id, name, code")
    .eq("id", sectorId)
    .single()

  if (!sector) notFound()

  // Si un formulaire existe déjà pour ce secteur, rediriger vers le modifier
  const { data: existing, error: existingError } = await supabase
    .from("form_templates")
    .select("id")
    .eq("sector_id", sectorId)
    .maybeSingle()

  if (existingError && existingError.code !== "PGRST116") {
    throw new Error(
      `Erreur Supabase (${existingError.code}) : ${existingError.message}. ` +
      "Vérifiez que la migration 20260604000000_simplify_form_schema.sql a été appliquée."
    )
  }

  if (existing) {
    redirect(`/direction/formulaires/${existing.id}/modifier`)
  }

  return (
    <div className="flex flex-col h-full">
      <SchemaEditorClient
        templateId={null}
        sectorId={sector.id}
        templateTitle={`Formulaire de collecte — ${sector.name}`}
        sectorName={sector.name}
        schema={{ sections: [] }}
        isLocked={false}
        isPublished={false}
      />
    </div>
  )
}
