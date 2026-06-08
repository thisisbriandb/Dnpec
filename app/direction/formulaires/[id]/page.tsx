import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/app/lib/supabase/server"
import { ArrowLeft, PencilLine, CheckCircle2, Clock, Layers, Megaphone, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const STATUS_CFG = {
  published: { label: "Publié",    Icon: CheckCircle2, cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  draft:     { label: "Brouillon", Icon: PencilLine,   cls: "text-amber-700   bg-amber-50   border-amber-200"   },
} as const

const FIELD_TYPE_LABEL: Record<string, string> = {
  integer: "Entier", decimal: "Décimal", short_text: "Texte court", long_text: "Texte long",
  date: "Date", single_select: "Sélection unique", multi_select: "Sélection multiple",
  checkbox: "Case à cocher", data_table: "Tableau", file: "Fichier",
}

export default async function FormulaireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: template } = await supabase
    .from("form_templates")
    .select(`
      id, title, description, status, schema, published_at,
      sector:sectors!sector_id(id, name, code),
      publisher:profiles!published_by(full_name)
    `)
    .eq("id", id)
    .single()

  if (!template) notFound()

  const sector    = template.sector    as unknown as { id: string; name: string; code: string } | null
  const publisher = template.publisher as unknown as { full_name: string } | null
  const schema    = (template.schema ?? { sections: [] }) as {
    sections: {
      key: string; title: string
      fields: { key: string; label: string; type: string; required: boolean; unit?: string | null }[]
    }[]
  }

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title, status, opens_at, closes_at, reference_period")
    .eq("form_template_id", id)
    .in("status", ["scheduled", "active", "closed"])
    .order("opens_at", { ascending: false })
    .limit(5)

  const { count: activeCampaignCount } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("form_template_id", id)
    .in("status", ["scheduled", "active"])

  const isLocked    = (activeCampaignCount ?? 0) > 0
  const isPublished = template.status === "published"
  const statusCfg   = STATUS_CFG[template.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.draft
  const totalFields = schema.sections.reduce((s, sec) => s + sec.fields.length, 0)

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/direction/formulaires"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Formulaires
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/60">
              <Layers className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {sector && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-primary/10 text-primary">
                    {sector.code}
                  </span>
                )}
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border",
                  statusCfg.cls,
                )}>
                  <statusCfg.Icon className="size-3" />
                  {statusCfg.label}
                </span>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-status-warn-bg text-status-warn-text border border-status-warn/30">
                    <Lock className="size-3" />
                    Verrouillé
                  </span>
                )}
              </div>
              <h1 className="text-lg font-semibold text-foreground">{template.title}</h1>
              {template.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{template.description}</p>
              )}
            </div>
          </div>

          <Link
            href={`/direction/formulaires/${id}/modifier`}
            title={isPublished ? "Formulaire publié : non modifiable" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              isPublished
                ? "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            aria-disabled={isPublished}
          >
            <PencilLine className="size-3.5" />
            Modifier le formulaire
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground">
          <span><strong className="text-foreground tabular-nums">{schema.sections.length}</strong> section{schema.sections.length !== 1 ? "s" : ""}</span>
          <span><strong className="text-foreground tabular-nums">{totalFields}</strong> champ{totalFields !== 1 ? "s" : ""}</span>
          {publisher && template.published_at && (
            <span>
              Publié le{" "}
              <strong className="text-foreground">
                {new Date(template.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </strong>
              {" "}par {publisher.full_name}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 grid gap-6 lg:grid-cols-3">

        {/* Schema */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Structure du formulaire
          </h2>

          {schema.sections.length === 0 ? (
            <div className="rounded-card border-2 border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">Aucune section configurée.</p>
              <Link
                href={`/direction/formulaires/${id}/modifier`}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <PencilLine className="size-3.5" />
                Configurer maintenant
              </Link>
            </div>
          ) : (
            schema.sections.map((section) => (
              <div key={section.key} className="rounded-card border border-border bg-card shadow-subtle overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-muted/30">
                  <p className="text-sm font-semibold text-foreground">{section.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {section.fields.length} champ{section.fields.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {section.fields.map((field) => (
                    <div key={field.key} className="flex items-center justify-between px-4 py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-foreground font-medium truncate">{field.label}</span>
                        {field.required && (
                          <span className="text-[10px] text-status-bad font-semibold">requis</span>
                        )}
                        {field.unit && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                            {field.unit}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded ml-4">
                        {FIELD_TYPE_LABEL[field.type] ?? field.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Campagnes récentes */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Campagnes récentes
          </h2>

          {!campaigns || campaigns.length === 0 ? (
            <div className="rounded-card border border-border bg-card p-4 text-center">
              <Megaphone className="size-6 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Aucune campagne encore créée pour ce formulaire.</p>
            </div>
          ) : (
            campaigns.map((c) => {
              const isActive = c.status === "active"
              return (
                <div key={c.id} className="rounded-card border border-border bg-card p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-foreground leading-tight line-clamp-2">{c.title}</p>
                    <span className={cn(
                      "shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : c.status === "scheduled"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-muted text-muted-foreground border border-border",
                    )}>
                      {isActive ? "Active" : c.status === "scheduled" ? "Planifiée" : "Clôturée"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{c.reference_period}</p>
                  <p className="text-[10px] text-muted-foreground">
                    <Clock className="inline size-2.5 mr-0.5" />
                    {new Date(c.opens_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    {" → "}
                    {new Date(c.closes_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
