import Link from "next/link"
import { FileText, Settings } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function FormulairesPage() {
  const supabase = await createClient()

  const { data: templates } = await supabase
    .from("form_templates")
    .select(`
      id, title, description,
      sector:sectors!sector_id(id, name, code),
      current_version:form_versions!current_version_id(
        id, version_number, status, published_at
      )
    `)
    .order("created_at", { ascending: true })

  const rows = templates ?? []

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Formulaires</h1>
          <p className="text-sm text-muted-foreground">
            Un formulaire type par secteur d&apos;activité
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((tpl) => {
          const sector = tpl.sector as unknown as { id: string; name: string; code: string } | null
          const cv = tpl.current_version as unknown as {
            id: string
            version_number: number
            status: string
            published_at: string | null
          } | null

          return (
            <div
              key={tpl.id}
              className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-subtle"
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <FileText className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      {sector?.code ?? "—"}
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {sector?.name ?? "—"}
                    </p>
                  </div>
                </div>
                {cv ? (
                  <StatusBadge status={cv.status} size="sm" />
                ) : (
                  <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Non configuré
                  </span>
                )}
              </div>

              {/* Version info */}
              <div className="text-xs text-muted-foreground space-y-0.5">
                {cv ? (
                  <>
                    <p>
                      <span className="font-medium text-foreground font-mono">
                        v{cv.version_number}
                      </span>
                      {cv.status === "published" && cv.published_at && (
                        <span className="ml-1">— publiée le {formatDate(cv.published_at)}</span>
                      )}
                    </p>
                    <p className="truncate">{tpl.title}</p>
                  </>
                ) : (
                  <p>Aucune version publiée</p>
                )}
              </div>

              {/* Action */}
              <div className="mt-auto">
                <Link
                  href={`/direction/formulaires/${tpl.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
                >
                  <Settings className="size-3.5" />
                  Configurer
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border py-16 text-center">
          <FileText className="size-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Aucun formulaire</p>
          <p className="text-xs text-muted-foreground mt-1">
            Les formulaires sont créés automatiquement lors de la création des secteurs.
          </p>
        </div>
      )}
    </div>
  )
}
