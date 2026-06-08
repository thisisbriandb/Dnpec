import { notFound, redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import { SchemaEditorClient } from "@/app/direction/_components/schema-editor-client"
import type { FormSchemaPayload } from "@/app/direction/_components/schema-editor-client"

export const dynamic = "force-dynamic"

export default async function ModifierFormulairePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "super_admin" && profile?.role !== "analyste") {
    redirect(`/direction/formulaires/${id}`)
  }

  const { data: template, error: templateError } = await supabase
    .from("form_templates")
    .select(`
      id, title, status, schema,
      sector:sectors(id, name)
    `)
    .eq("id", id)
    .single()

  if (!template) {
    if (templateError && (templateError as { code?: string }).code !== "PGRST116") {
      const err = templateError as { code?: string; message?: string }
      throw new Error(
        `Impossible de charger le formulaire (${err.code}) : ${err.message}. ` +
        "Vérifiez que la migration 20260604000000_simplify_form_schema.sql a été appliquée à Supabase."
      )
    }
    notFound()
  }

  // Un formulaire publié est verrouillé : il n'est plus modifiable.
  if (template.status === "published") {
    redirect(`/direction/formulaires/${id}`)
  }

  const sector = template.sector as unknown as { id: string; name: string } | null

  return (
    <div className="flex flex-col h-full">
      <SchemaEditorClient
        templateId={template.id}
        templateTitle={template.title}
        sectorName={sector?.name ?? ""}
        schema={(template.schema ?? { sections: [] }) as FormSchemaPayload}
      />
    </div>
  )
}
