import { notFound } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatDate } from "@/lib/format"
import { FormVersionsTable, type FormVersion } from "@/app/direction/_components/form-versions-table"

export const dynamic = "force-dynamic"

const FIELD_TYPE_LABELS: Record<string, string> = {
  short_text: "Texte court",
  long_text: "Texte long",
  integer: "Nombre entier",
  decimal: "Nombre décimal",
  date: "Date",
  single_select: "Sélection unique",
  multi_select: "Sélection multiple",
  checkbox: "Case à cocher",
  data_table: "Tableau",
  file: "Fichier",
}

type SchemaField = {
  key: string
  label: string
  type: string
  required: boolean
  unit?: string
}

type SchemaSection = {
  key: string
  title: string
  fields: SchemaField[]
}

export default async function FormTemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: template }, { data: versions }] = await Promise.all([
    supabase
      .from("form_templates")
      .select(`
        id, title, description, created_at,
        sector:sectors(id, name),
        current_version:form_versions!current_version_id(
          id, version_number, status, schema, published_at,
          publisher:profiles!published_by(full_name)
        )
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("form_versions")
      .select("id, version_number, status, published_at, created_at, creator:profiles!created_by(full_name)")
      .eq("template_id", id)
      .order("version_number", { ascending: false }),
  ])

  if (!template) notFound()

  const currentVersion = template.current_version as unknown as {
    id: string
    version_number: number
    status: string
    schema: { sections: SchemaSection[] }
    published_at: string | null
    publisher: { full_name: string } | null
  } | null

  const hasDraft = (versions ?? []).some((v) => v.status === "draft")

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground mb-1">
            {(template.sector as unknown as { name: string } | null)?.name ?? "Secteur inconnu"}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-title font-semibold text-foreground">{template.title}</h1>
            {currentVersion && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                  v{currentVersion.version_number}
                </span>
                <StatusBadge status={currentVersion.status} size="md" />
              </div>
            )}
          </div>
          {template.description && (
            <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
          )}
        </div>
        <Button
          render={<Link href={`/direction/formulaires/${id}/nouvelle-version`} />}
          nativeButton={false}
          size="sm"
        >
          <Plus className="size-4" />
          {hasDraft ? "Continuer le brouillon" : "Nouvelle version"}
        </Button>
      </div>

      {/* Schema viewer */}
      {currentVersion?.schema?.sections && currentVersion.schema.sections.length > 0 ? (
        <div className="rounded-card border border-border bg-surface p-5 shadow-subtle">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Schéma actuel — v{currentVersion.version_number}
            {currentVersion.published_at && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                publiée le {formatDate(currentVersion.published_at)}
                {currentVersion.publisher?.full_name && ` par ${currentVersion.publisher.full_name}`}
              </span>
            )}
          </h2>
          <div className="space-y-4">
            {currentVersion.schema.sections.map((section) => (
              <div key={section.key} className="rounded-md border border-border p-4">
                <h3 className="text-sm font-medium text-foreground mb-3">{section.title}</h3>
                <div className="space-y-2">
                  {section.fields.map((field) => (
                    <div key={field.key} className="flex items-center gap-2 text-sm">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground whitespace-nowrap">
                        {FIELD_TYPE_LABELS[field.type] ?? field.type}
                      </span>
                      <span className="font-medium">{field.label}</span>
                      {field.required && (
                        <span className="text-status-bad text-xs" aria-label="Requis">*</span>
                      )}
                      {field.unit && (
                        <span className="text-muted-foreground text-xs">({field.unit})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-card border border-border bg-surface p-5 shadow-subtle">
          <p className="text-sm text-muted-foreground">Aucune version publiée. Créez une première version.</p>
        </div>
      )}

      {/* Versions history */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Historique des versions</h2>
        <FormVersionsTable versions={(versions ?? []) as unknown as FormVersion[]} />
      </div>
    </div>
  )
}
