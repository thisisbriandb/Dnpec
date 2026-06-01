import { notFound, redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import { SchemaEditorClient } from "@/app/direction/_components/schema-editor-client"
import type { FormSchemaPayload } from "@/app/direction/_components/schema-editor-client"

export const dynamic = "force-dynamic"

export default async function NouvelleVersionPage({
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

  const { data: template } = await supabase
    .from("form_templates")
    .select(`
      id, title, current_version_id,
      sector:sectors!sector_id(id, name)
    `)
    .eq("id", id)
    .single()

  if (!template) notFound()

  const sector = template.sector as unknown as { id: string; name: string } | null

  const { data: existingDraft } = await supabase
    .from("form_versions")
    .select("id, schema")
    .eq("template_id", id)
    .eq("status", "draft")
    .maybeSingle()

  let seedSchema: FormSchemaPayload | null = null
  if (!existingDraft && template.current_version_id) {
    const { data: currentVersion } = await supabase
      .from("form_versions")
      .select("schema")
      .eq("id", template.current_version_id)
      .single()
    seedSchema = (currentVersion?.schema ?? null) as FormSchemaPayload | null
  }

  return (
    <div className="flex flex-col h-full">
      <SchemaEditorClient
        templateId={template.id}
        templateTitle={template.title}
        sectorName={sector?.name ?? ""}
        existingDraft={
          existingDraft
            ? { id: existingDraft.id, schema: existingDraft.schema as unknown as FormSchemaPayload }
            : null
        }
        hasCurrentVersion={!!template.current_version_id}
        seedSchema={seedSchema}
      />
    </div>
  )
}
