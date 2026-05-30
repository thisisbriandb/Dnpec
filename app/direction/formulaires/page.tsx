import Link from "next/link"
import { FileText } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function FormulairesPage() {
  const supabase = await createClient()

  const { data: templates } = await supabase
    .from("form_templates")
    .select(`
      id, title, description, created_at,
      sector:sectors(id, name, is_active),
      current_version:form_versions!current_version_id(id, version_number, status, published_at)
    `)
    .order("created_at", { ascending: false })

  if (!templates || templates.length === 0) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-title font-semibold text-foreground">Formulaires types</h1>
        <EmptyState
          icon={FileText}
          title="Aucun formulaire"
          description="Les formulaires types sont créés par secteur. Contactez l'administrateur pour configurer les secteurs."
          size="lg"
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-title font-semibold text-foreground">Formulaires types</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Un formulaire par secteur d&apos;activité — {templates.length} formulaire{templates.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl) => {
          const version = tpl.current_version as unknown as {
            id: string
            version_number: number
            status: string
            published_at: string | null
          } | null

          return (
            <Link
              key={tpl.id}
              href={`/direction/formulaires/${tpl.id}`}
              className="group rounded-card border border-border bg-surface p-5 shadow-subtle hover:border-primary/40 hover:shadow-medium transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-4 text-primary" />
                </div>
                {version ? (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                      v{version.version_number}
                    </span>
                    <StatusBadge status={version.status} size="sm" />
                  </div>
                ) : (
                  <StatusBadge status="draft" size="sm" />
                )}
              </div>

              <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                {tpl.title}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {(tpl.sector as unknown as { name: string } | null)?.name ?? "—"}
              </p>
              {tpl.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{tpl.description}</p>
              )}
              {version?.published_at && (
                <p className="mt-3 text-xs text-muted-foreground border-t border-border pt-2">
                  Publiée le {formatDate(version.published_at)}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
