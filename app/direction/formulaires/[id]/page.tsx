import Link from "next/link"
import { notFound } from "next/navigation"
import { Plus, PencilLine, ArrowLeft } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { FormVersionsTable } from "@/app/direction/_components/form-versions-table"
import type { FormVersion } from "@/app/direction/_components/form-versions-table"

export const dynamic = "force-dynamic"

export default async function FormulaireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: { user } },
    { data: template },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("form_templates")
      .select(`
        id, title, description, current_version_id,
        sector:sectors!sector_id(id, name, code),
        versions:form_versions!template_id(
          id, version_number, status, published_at, created_at,
          creator:profiles!created_by(full_name)
        )
      `)
      .eq("id", id)
      .single(),
  ])

  if (!template) notFound()

  const sector = template.sector as unknown as { id: string; name: string; code: string } | null

  const rawVersions = (template.versions as unknown[]) ?? []
  const versions: FormVersion[] = (rawVersions as Array<{
    id: string
    version_number: number
    status: string
    published_at: string | null
    created_at: string
    creator: { full_name: string } | null
  }>)
    .sort((a, b) => b.version_number - a.version_number)
    .map((v) => ({
      id: v.id,
      version_number: v.version_number,
      status: v.status,
      published_at: v.published_at,
      created_at: v.created_at,
      creator: v.creator,
    }))

  const currentVersion = versions.find((v) => v.id === template.current_version_id)
  const hasDraft = versions.some((v) => v.status === "draft")

  let canEdit = false
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    canEdit = profile?.role === "super_admin" || profile?.role === "analyste"
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back link */}
      <Link
        href="/direction/formulaires"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Formulaires
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="font-mono uppercase tracking-wider">{sector?.code}</span>
            <span>·</span>
            <span>{sector?.name}</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">{template.title}</h1>
          {template.description && (
            <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentVersion && (
            <StatusBadge status={currentVersion.status} />
          )}
          {canEdit && (
            <Link
              href={`/direction/formulaires/${id}/nouvelle-version`}
              className={buttonVariants({ size: "sm" })}
            >
              {hasDraft ? (
                <>
                  <PencilLine className="size-3.5" />
                  Modifier le brouillon
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Nouvelle version
                </>
              )}
            </Link>
          )}
        </div>
      </div>

      {/* Versions table */}
      <div className="rounded-card border border-border bg-surface shadow-subtle">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Historique des versions</h2>
        </div>
        <div className="p-4">
          <FormVersionsTable versions={versions} />
        </div>
      </div>
    </div>
  )
}
