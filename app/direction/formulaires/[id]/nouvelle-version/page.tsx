import { notFound } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import { SchemaEditorClient } from "@/app/direction/_components/schema-editor-client"

export const dynamic = "force-dynamic"

export default async function NouvelleVersionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: template }, { data: draftVersion }, { data: latestPublished }] =
    await Promise.all([
      supabase
        .from("form_templates")
        .select("id, title, sector:sectors(name)")
        .eq("id", id)
        .single(),
      supabase
        .from("form_versions")
        .select("id, version_number, schema")
        .eq("template_id", id)
        .eq("status", "draft")
        .maybeSingle(),
      supabase
        .from("form_versions")
        .select("id, version_number, schema")
        .eq("template_id", id)
        .eq("status", "published")
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

  if (!template) notFound()

  return (
    <SchemaEditorClient
      templateId={id}
      templateTitle={template.title}
      sectorName={(template.sector as unknown as { name: string } | null)?.name ?? ""}
      existingDraft={draftVersion ? { id: draftVersion.id, schema: draftVersion.schema } : null}
      hasCurrentVersion={!!latestPublished}
      seedSchema={latestPublished?.schema ?? null}
    />
  )
}
