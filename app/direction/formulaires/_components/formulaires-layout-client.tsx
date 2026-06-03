"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  Lock,
  PencilLine,
  Plus,
  Settings,
  Upload,
  Table2,
  Calendar,
  Hash,
  AlignLeft,
  AlignJustify,
  ToggleLeft,
  ListChecks,
  List,
  Eye,
  Send,
  Building2,
  X,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

/* ── Option normalization ───────────────────────────────────────── */
function normalizeOption(raw: unknown): { key: string; label: string } {
  if (typeof raw === "string") return { key: raw, label: raw }
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>
    const key   = String(o.id ?? o.key ?? o.value ?? "")
    const label = String(o.label ?? o.name ?? o.text ?? o.value ?? key)
    return { key, label }
  }
  return { key: String(raw), label: String(raw) }
}

/* ── Types ──────────────────────────────────────────────────────── */
export type FormField = {
  key: string
  label: string
  type: string
  required: boolean
  unit?: string | null
  options?: string[]
}

export type FormSection = {
  key: string
  title: string
  fields: FormField[]
}

export type FormSchema = {
  sections: FormSection[]
}

export type SectorItem = {
  id: string
  code: string
  name: string
  description: string | null
  template: {
    id: string
    title: string
    description: string | null
    status: "draft" | "published"
    schema: FormSchema
    published_at: string | null
    publisher_name: string | null
    active_campaign_count: number
  } | null
}

/* ── Main layout ────────────────────────────────────────────────── */
export function FormulaireLayoutClient({ sectors }: { sectors: SectorItem[] }) {
  const [selectedId, setSelectedId] = React.useState<string | null>(
    sectors[0]?.id ?? null
  )
  const selected = sectors.find((s) => s.id === selectedId) ?? null

  const publishedCount    = sectors.filter((s) => s.template?.status === "published").length
  const draftCount        = sectors.filter((s) => s.template?.status === "draft").length
  const unconfiguredCount = sectors.filter((s) => !s.template).length

  return (
    <div className="flex flex-col h-full">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="shrink-0 px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight text-foreground">
              Formulaires de collecte
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Un formulaire type par secteur d&apos;activité
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-status-ok-bg text-status-ok-text text-xs font-semibold border border-status-ok/20">
              <CheckCircle2 className="size-3.5" />
              {publishedCount} publié{publishedCount !== 1 ? "s" : ""}
            </span>
            {draftCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-status-warn-bg text-status-warn-text text-xs font-semibold border border-status-warn/20">
                <AlertCircle className="size-3.5" />
                {draftCount} brouillon{draftCount !== 1 ? "s" : ""}
              </span>
            )}
            {unconfiguredCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-status-gray-bg text-status-gray-text text-xs font-semibold border border-status-gray/20">
                <FileText className="size-3.5" />
                {unconfiguredCount} non configuré{unconfiguredCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Aside ──────────────────────────────────────────── */}
        <aside
          className="w-72 shrink-0 border-r border-border bg-card overflow-y-auto flex flex-col"
          style={{ scrollbarWidth: "thin" }}
        >
          {/* Aside header */}
          <div className="px-4 py-3 border-b border-border shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Secteurs d&apos;activité
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-status-ok-text bg-status-ok-bg px-1.5 py-0.5 rounded-md border border-status-ok/20">
                <span className="size-1.5 rounded-full bg-status-ok" />
                {publishedCount} publiés
              </span>
              {draftCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-status-warn-text bg-status-warn-bg px-1.5 py-0.5 rounded-md border border-status-warn/20">
                  <span className="size-1.5 rounded-full bg-status-warn" />
                  {draftCount} brouillons
                </span>
              )}
              {unconfiguredCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-status-gray-text bg-status-gray-bg px-1.5 py-0.5 rounded-md border border-status-gray/20">
                  <span className="size-1.5 rounded-full bg-status-gray" />
                  {unconfiguredCount} vides
                </span>
              )}
            </div>
          </div>

          {/* Sector list */}
          <ul className="p-2 space-y-0.5 flex-1">
            {sectors.map((s) => (
              <SectorListItem
                key={s.id}
                sector={s}
                isSelected={s.id === selectedId}
                onSelect={() => setSelectedId(s.id)}
              />
            ))}
          </ul>
        </aside>

        {/* ── Content ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto" style={{ background: "var(--color-surface-2)" }}>
          {!selected ? (
            <EmptySelection />
          ) : selected.template ? (
            <FormDetail sector={selected} template={selected.template} />
          ) : (
            <NoTemplate sector={selected} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Sector list item ───────────────────────────────────────────── */
function SectorListItem({
  sector,
  isSelected,
  onSelect,
}: {
  sector: SectorItem
  isSelected: boolean
  onSelect: () => void
}) {
  const status          = sector.template?.status ?? null
  const activeCampaigns = sector.template?.active_campaign_count ?? 0
  const sectionCount    = sector.template?.schema.sections.length ?? 0
  const fieldCount      = sector.template?.schema.sections.reduce(
    (sum, s) => sum + s.fields.length, 0
  ) ?? 0

  const statusDot =
    status === "published" ? "bg-status-ok"
    : status === "draft"   ? "bg-status-warn"
    : "bg-status-gray"

  const statusLabel =
    status === "published" ? "Publié"
    : status === "draft"   ? "Brouillon"
    : "Non configuré"

  const statusTextCls =
    status === "published" ? "text-status-ok-text"
    : status === "draft"   ? "text-status-warn-text"
    : "text-status-gray-text"

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150",
          "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1",
          isSelected
            ? "bg-accent border border-primary/20 shadow-subtle"
            : "border border-transparent hover:bg-muted/60 hover:border-border"
        )}
      >
        {/* Status indicator */}
        <div className="mt-1 shrink-0">
          <span className={cn("block size-2 rounded-full", statusDot)} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={cn(
                "text-[9px] font-bold px-1.5 py-px rounded uppercase tracking-wider",
                isSelected
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {sector.code}
            </span>
            <span className={cn("text-[10px] font-medium", statusTextCls)}>
              {statusLabel}
            </span>
          </div>
          <p
            className={cn(
              "text-sm font-medium truncate leading-tight",
              isSelected ? "text-primary" : "text-foreground"
            )}
          >
            {sector.name}
          </p>
          {sector.template ? (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {sectionCount} section{sectionCount !== 1 ? "s" : ""}
              {" · "}
              {fieldCount} champ{fieldCount !== 1 ? "s" : ""}
              {activeCampaigns > 0 && (
                <span className="ml-1.5 text-status-ok-text font-medium">
                  · {activeCampaigns} campagne{activeCampaigns !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground mt-0.5 italic">
              Aucun formulaire configuré
            </p>
          )}
        </div>
      </button>
    </li>
  )
}

/* ── Form detail ────────────────────────────────────────────────── */
function FormDetail({
  sector,
  template,
}: {
  sector: SectorItem
  template: NonNullable<SectorItem["template"]>
}) {
  const [previewOpen, setPreviewOpen] = React.useState(false)

  const isLocked    = template.active_campaign_count > 0
  const isPublished = template.status === "published"
  const totalFields = template.schema.sections.reduce(
    (sum, s) => sum + s.fields.length, 0
  )

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Sticky sub-header ─────────────────────────────── */}
      <div
        className="px-6 py-4 border-b border-border sticky top-0 z-10 shadow-subtle"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">

          {/* Left: identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent shadow-subtle">
              <Layers className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-primary/10 text-primary border border-primary/15">
                  {sector.code}
                </span>
                {isPublished ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-status-ok-bg text-status-ok-text border border-status-ok/20">
                    <CheckCircle2 className="size-3" /> Publié
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-status-warn-bg text-status-warn-text border border-status-warn/20">
                    <AlertCircle className="size-3" /> Brouillon
                  </span>
                )}
                {isLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-status-warn-bg text-status-warn-text border border-status-warn/20">
                    <Lock className="size-3" /> Verrouillé
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold text-foreground leading-tight truncate max-w-sm">
                {template.title}
              </h2>
            </div>
          </div>

          {/* Right: actions — clear hierarchy */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border border-border bg-card hover:bg-muted hover:border-primary/30 transition-all text-foreground"
            >
              <Eye className="size-3.5 text-muted-foreground" />
              Aperçu entreprise
            </button>
            <Link
              href={`/direction/formulaires/${template.id}/modifier`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors shadow-subtle",
                isLocked
                  ? "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              aria-disabled={isLocked}
            >
              <PencilLine className="size-3.5" />
              Modifier
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/60 flex-wrap">
          <StatPill value={template.schema.sections.length} label={template.schema.sections.length !== 1 ? "sections" : "section"} />
          <span className="text-border mx-1">·</span>
          <StatPill value={totalFields} label={totalFields !== 1 ? "champs" : "champ"} />
          {template.active_campaign_count > 0 && (
            <>
              <span className="text-border mx-1">·</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-status-ok-text font-medium">
                <span className="size-1.5 rounded-full bg-status-ok animate-pulse" />
                {template.active_campaign_count} campagne{template.active_campaign_count !== 1 ? "s" : ""} active{template.active_campaign_count !== 1 ? "s" : ""}
              </span>
            </>
          )}
          {template.publisher_name && template.published_at && (
            <>
              <span className="text-border mx-1">·</span>
              <span className="text-xs text-muted-foreground">
                Publié le{" "}
                <strong className="text-foreground font-medium">
                  {new Date(template.published_at).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </strong>
                {" "}par{" "}
                <strong className="text-foreground font-medium">{template.publisher_name}</strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Form preview (read-only) ───────────────────────── */}
      <div className="flex-1 px-6 py-8">
        {template.schema.sections.length === 0 ? (
          <EmptySchema templateId={template.id} />
        ) : (
          <FormPreview
            title={template.title}
            description={template.description}
            schema={template.schema}
          />
        )}
      </div>

      {/* Fill modal */}
      <FormFillModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={template.title}
        description={template.description}
        schema={template.schema}
      />
    </div>
  )
}

/* ── Tiny stat pill ─────────────────────────────────────────────── */
function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <strong className="text-foreground font-semibold tabular-nums">{value}</strong>
      {label}
    </span>
  )
}

/* ── Empty schema ───────────────────────────────────────────────── */
function EmptySchema({ templateId }: { templateId: string }) {
  return (
    <div className="max-w-2xl mx-auto rounded-2xl border-2 border-dashed border-border p-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 mx-auto mb-4">
        <FileText className="size-6 text-muted-foreground/40" />
      </div>
      <p className="text-base font-semibold text-foreground mb-1.5">Formulaire vide</p>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
        Ce formulaire n&apos;a pas encore de sections ni de champs configurés.
      </p>
      <Link
        href={`/direction/formulaires/${templateId}/modifier`}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-subtle"
      >
        <PencilLine className="size-3.5" />
        Configurer le schéma
      </Link>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   READ-ONLY FORM PREVIEW
   ───────────────────────────────────────────────────────────────── */
function FormPreview({
  title,
  description,
  schema,
}: {
  title: string
  description: string | null
  schema: FormSchema
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Title card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-medium">
        <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
        <div className="px-7 py-6">
          <h3 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
          )}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/60">
            <span className="text-xs text-muted-foreground/70 italic">
              * Champs obligatoires
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground/40 uppercase tracking-widest font-medium">
              Aperçu lecture seule
            </span>
          </div>
        </div>
      </div>

      {/* Sections */}
      {schema.sections.map((section, i) => (
        <ReadOnlySectionCard key={section.key} section={section} index={i} />
      ))}
    </div>
  )
}

/* ── Read-only section card ─────────────────────────────────────── */
function ReadOnlySectionCard({
  section,
  index,
}: {
  section: FormSection
  index: number
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-subtle">
      {/* Section header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-muted/20">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/15">
          {index + 1}
        </span>
        <div>
          <p className="text-base font-semibold text-foreground leading-tight">{section.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">
            {section.fields.length} champ{section.fields.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="divide-y divide-border/50">
        {section.fields.map((field, fi) => (
          <div key={field.key || fi} className="px-6 py-5">
            <ReadOnlyField field={field} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Read-only field ────────────────────────────────────────────── */
function ReadOnlyField({ field }: { field: FormField }) {
  /* Disabled input styling: muted bg to visually signal non-editable */
  const disabledInput =
    "w-full rounded-lg border border-input/70 bg-muted/40 px-3 py-2 text-sm text-foreground/40 cursor-not-allowed placeholder:text-muted-foreground/30"

  return (
    <div>
      {/* Label row */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-sm font-medium text-foreground">
          {field.label}
        </span>
        {field.required && (
          <span className="text-red-500 text-sm leading-none">*</span>
        )}
        {field.unit && (
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
            {field.unit}
          </span>
        )}
        {/* Type chip — always inline, never absolute */}
        <FieldTypeChip type={field.type} />
      </div>

      {/* Control */}
      <ReadOnlyControl field={field} disabledCls={disabledInput} />
    </div>
  )
}

function ReadOnlyControl({ field, disabledCls }: { field: FormField; disabledCls: string }) {
  if (field.type === "short_text") {
    return <input type="text" disabled placeholder="Réponse courte" className={disabledCls} />
  }
  if (field.type === "long_text") {
    return <textarea disabled rows={3} placeholder="Réponse longue…" className={cn(disabledCls, "resize-none")} />
  }
  if (field.type === "integer" || field.type === "decimal") {
    return (
      <input
        type="number"
        disabled
        placeholder={field.type === "decimal" ? "0.00" : "0"}
        className={disabledCls}
      />
    )
  }
  if (field.type === "date") {
    return <input type="date" disabled className={disabledCls} />
  }
  if (field.type === "single_select" || field.type === "multi_select") {
    const rawOptions = (field.options ?? []) as unknown[]
    const options    = rawOptions.map(normalizeOption)
    const isMulti    = field.type === "multi_select"
    if (options.length === 0) {
      return <p className="text-xs text-muted-foreground/60 italic">Aucune option configurée</p>
    }
    return (
      <div className="space-y-2">
        {options.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3 text-sm text-foreground/50 cursor-not-allowed select-none">
            <span className={cn(
              "flex size-4 shrink-0 items-center justify-center border-2 border-input/60 bg-muted/40",
              isMulti ? "rounded" : "rounded-full"
            )} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    )
  }
  if (field.type === "checkbox") {
    return (
      <div className="flex items-center gap-3 text-sm text-foreground/50 cursor-not-allowed select-none">
        <span className="flex size-4 shrink-0 items-center justify-center rounded border-2 border-input/60 bg-muted/40" />
        <span>{field.label}</span>
      </div>
    )
  }
  if (field.type === "file") {
    return (
      <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-input/60 bg-muted/20 px-4 py-3.5 cursor-not-allowed">
        <Upload className="size-4 text-muted-foreground/30 shrink-0" />
        <span className="text-sm text-muted-foreground/50">Fichier à joindre</span>
      </div>
    )
  }
  if (field.type === "data_table") {
    return (
      <div className="rounded-lg border border-input/70 overflow-hidden bg-muted/20">
        <div className="flex bg-muted/50 border-b border-input/60">
          {["Colonne 1", "Colonne 2", "Colonne 3"].map((col, i) => (
            <div key={col} className={cn("flex-1 px-3 py-2 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide", i > 0 && "border-l border-input/60")}>
              {col}
            </div>
          ))}
        </div>
        {[0, 1].map((row) => (
          <div key={row} className="flex border-b border-input/60 last:border-b-0">
            {[0, 1, 2].map((col) => (
              <div key={col} className={cn("flex-1 px-3 py-2 text-xs text-muted-foreground/30", col > 0 && "border-l border-input/60")}>—</div>
            ))}
          </div>
        ))}
      </div>
    )
  }
  return <input type="text" disabled placeholder="—" className={disabledCls} />
}

/* ── Field type chip ────────────────────────────────────────────── */
const FIELD_TYPE_META: Record<string, { icon: React.ElementType; label: string }> = {
  short_text:    { icon: AlignLeft,    label: "Texte court"        },
  long_text:     { icon: AlignJustify, label: "Texte long"         },
  integer:       { icon: Hash,         label: "Entier"             },
  decimal:       { icon: Hash,         label: "Décimal"            },
  date:          { icon: Calendar,     label: "Date"               },
  single_select: { icon: List,         label: "Sélection unique"   },
  multi_select:  { icon: ListChecks,   label: "Sélection multiple" },
  checkbox:      { icon: ToggleLeft,   label: "Case à cocher"      },
  data_table:    { icon: Table2,       label: "Tableau"            },
  file:          { icon: Upload,       label: "Fichier"            },
}

function FieldTypeChip({ type }: { type: string }) {
  const meta = FIELD_TYPE_META[type]
  if (!meta) return null
  const Icon = meta.icon
  return (
    <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded border border-border/50">
      <Icon className="size-2.5" />
      {meta.label}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────
   FILL MODAL — vue entreprise remplissable
   ───────────────────────────────────────────────────────────────── */
function FormFillModal({
  open,
  onClose,
  title,
  description,
  schema,
}: {
  open: boolean
  onClose: () => void
  title: string
  description: string | null
  schema: FormSchema
}) {
  const [values, setValues] = React.useState<Record<string, string | string[]>>({})

  React.useEffect(() => {
    if (!open) setValues({})
  }, [open])

  function setValue(key: string, value: string | string[]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden shadow-strong"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/15">
              <Eye className="size-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold leading-none">
                Aperçu entreprise
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Vue simulée — les données saisies ne seront pas enregistrées
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Info banner — using design system tokens */}
        <div className="flex items-center gap-2.5 px-5 py-2.5 bg-status-info-bg border-b border-status-info/20 text-xs text-status-info-text shrink-0">
          <Building2 className="size-3.5 shrink-0" />
          <span>
            Ce formulaire sera affiché aux entreprises lors d&apos;une campagne de collecte.
          </span>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-5 py-6 space-y-5"
          style={{ background: "var(--color-surface-2)", scrollbarWidth: "thin" }}
        >
          {/* Title card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-medium">
            <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
            <div className="px-7 py-6">
              <h3 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
              )}
              <p className="text-xs text-muted-foreground/60 mt-4 pt-4 border-t border-border/60">
                * Les champs marqués d&apos;un astérisque sont obligatoires.
              </p>
            </div>
          </div>

          {schema.sections.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border p-10 text-center bg-card">
              <FileText className="size-8 text-muted-foreground/25 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucune section à afficher.</p>
            </div>
          )}

          {schema.sections.map((section, i) => (
            <FillableSectionBlock
              key={section.key}
              section={section}
              index={i}
              values={values}
              onValueChange={setValue}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-border shrink-0 bg-card">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="size-3.5" />
            Mode aperçu — non soumis
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-1.5 text-sm font-medium border border-border bg-background hover:bg-muted transition-colors"
            >
              Fermer
            </button>
            <button
              type="button"
              disabled
              title="Le bouton de soumission est désactivé en mode aperçu"
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium bg-primary/30 text-primary-foreground/70 cursor-not-allowed"
            >
              <Send className="size-3.5" />
              Soumettre
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Fillable section block ─────────────────────────────────────── */
function FillableSectionBlock({
  section,
  index,
  values,
  onValueChange,
}: {
  section: FormSection
  index: number
  values: Record<string, string | string[]>
  onValueChange: (key: string, value: string | string[]) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-subtle">
      {/* Section header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-muted/20">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/15">
          {index + 1}
        </span>
        <h4 className="text-base font-semibold text-foreground">{section.title}</h4>
      </div>

      {/* Fields */}
      <div className="divide-y divide-border/50">
        {section.fields.map((field) => (
          <div key={field.key} className="px-6 py-5">
            <FillableField
              field={field}
              value={values[field.key]}
              onChange={(val) => onValueChange(field.key, val)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Fillable field ─────────────────────────────────────────────── */
function FillableField({
  field,
  value,
  onChange,
}: {
  field: FormField
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
}) {
  const inputBase =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all duration-150"

  /* Label row — same pattern as read-only but no type chip */
  const Label = () => (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="text-sm font-medium text-foreground">{field.label}</span>
      {field.required && <span className="text-red-500 text-sm leading-none">*</span>}
      {field.unit && (
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
          {field.unit}
        </span>
      )}
    </div>
  )

  if (field.type === "short_text") {
    return (
      <div>
        <Label />
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Votre réponse"
          className={inputBase}
        />
      </div>
    )
  }

  if (field.type === "long_text") {
    return (
      <div>
        <Label />
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder="Développez votre réponse ici…"
          className={cn(inputBase, "resize-y min-h-[96px]")}
        />
      </div>
    )
  }

  if (field.type === "integer" || field.type === "decimal") {
    return (
      <div>
        <Label />
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.type === "decimal" ? "0.00" : "0"}
            step={field.type === "decimal" ? "0.01" : "1"}
            className={cn(inputBase, "flex-1")}
          />
          {field.unit && (
            <span className="shrink-0 inline-flex items-center px-3 py-2.5 rounded-lg border border-input bg-muted text-sm font-mono text-muted-foreground">
              {field.unit}
            </span>
          )}
        </div>
      </div>
    )
  }

  if (field.type === "date") {
    return (
      <div>
        <Label />
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputBase}
        />
      </div>
    )
  }

  if (field.type === "single_select") {
    const rawOptions = (field.options ?? []) as unknown[]
    const options    = rawOptions.map(normalizeOption)
    const strValue   = (value as string) ?? ""
    return (
      <div>
        <Label />
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 italic">Aucune option configurée</p>
        ) : (
          <div className="space-y-2.5 mt-1">
            {options.map(({ key, label }) => {
              const selected = strValue === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange(key)}
                  className="flex items-center gap-3 text-sm text-foreground w-full text-left group"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150",
                      selected
                        ? "border-primary bg-primary"
                        : "border-input bg-background group-hover:border-primary/50"
                    )}
                  >
                    {selected && <span className="size-1.5 rounded-full bg-white" />}
                  </span>
                  <span className={selected ? "font-medium text-foreground" : "text-foreground/80"}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (field.type === "multi_select") {
    const rawOptions = (field.options ?? []) as unknown[]
    const options    = rawOptions.map(normalizeOption)
    const arrValue   = (value as string[]) ?? []

    const toggle = (key: string) =>
      onChange(
        arrValue.includes(key)
          ? arrValue.filter((v) => v !== key)
          : [...arrValue, key]
      )

    return (
      <div>
        <Label />
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 italic">Aucune option configurée</p>
        ) : (
          <div className="space-y-2.5 mt-1">
            {options.map(({ key, label }) => {
              const checked = arrValue.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className="flex items-center gap-3 text-sm text-foreground w-full text-left group"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border-2 transition-all duration-150",
                      checked
                        ? "border-primary bg-primary"
                        : "border-input bg-background group-hover:border-primary/50"
                    )}
                  >
                    {checked && <Check className="size-2.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className={checked ? "font-medium text-foreground" : "text-foreground/80"}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (field.type === "checkbox") {
    const checked = (value as string) === "true"
    return (
      <button
        type="button"
        onClick={() => onChange(checked ? "false" : "true")}
        className="flex items-center gap-3 text-sm font-medium text-foreground group"
      >
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded border-2 transition-all duration-150",
            checked
              ? "border-primary bg-primary"
              : "border-input bg-background group-hover:border-primary/50"
          )}
        >
          {checked && <Check className="size-2.5 text-white" strokeWidth={3} />}
        </span>
        <span>
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
      </button>
    )
  }

  if (field.type === "file") {
    return (
      <div>
        <Label />
        <label className="flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-input bg-muted/10 px-4 py-7 cursor-pointer hover:bg-muted/20 hover:border-primary/40 transition-all duration-150">
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted/50">
            <Upload className="size-5 text-muted-foreground/50" />
          </div>
          <div className="text-center">
            <span className="text-sm font-medium text-foreground/80">Cliquez pour choisir un fichier</span>
            <p className="text-xs text-muted-foreground/60 mt-0.5">ou glissez-déposez ici</p>
          </div>
          <input type="file" className="sr-only" />
        </label>
      </div>
    )
  }

  if (field.type === "data_table") {
    return (
      <div>
        <Label />
        <div className="rounded-xl border border-input overflow-hidden shadow-subtle">
          <div className="flex bg-muted/60 border-b border-input">
            {["Colonne 1", "Colonne 2", "Colonne 3"].map((col, i) => (
              <div
                key={col}
                className={cn("flex-1 px-3 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide", i > 0 && "border-l border-input")}
              >
                {col}
              </div>
            ))}
          </div>
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex border-b border-input last:border-b-0">
              {[0, 1, 2].map((col) => (
                <div key={col} className={cn("flex-1", col > 0 && "border-l border-input")}>
                  <input
                    type="text"
                    placeholder="—"
                    className="w-full px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:bg-primary/5 transition-colors"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/50 mt-1.5">
          La structure finale du tableau sera définie dans le formulaire de collecte.
        </p>
      </div>
    )
  }

  return (
    <div>
      <Label />
      <input
        type="text"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Votre réponse"
        className={inputBase}
      />
    </div>
  )
}

/* ── No template state ──────────────────────────────────────────── */
function NoTemplate({ sector }: { sector: SectorItem }) {
  return (
    <div className="flex flex-col min-h-full">
      {/* Sub-header */}
      <div className="px-6 py-4 border-b border-border bg-card shadow-subtle sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 border border-border">
            <Layers className="size-5 text-muted-foreground/50" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-muted text-muted-foreground border border-border/60">
                {sector.code}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-status-gray-bg text-status-gray-text border border-status-gray/20">
                Non configuré
              </span>
            </div>
            <h2 className="text-sm font-semibold text-foreground">{sector.name}</h2>
          </div>
        </div>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center max-w-xs">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-card border-2 border-dashed border-border mx-auto mb-6 shadow-subtle">
            <FileText className="size-8 text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Aucun formulaire configuré
          </h3>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Le secteur <strong className="text-foreground">&ldquo;{sector.name}&rdquo;</strong> n&apos;a
            pas encore de formulaire de collecte. Configurez-en un pour pouvoir lancer des campagnes.
          </p>
          <Link
            href={`/direction/formulaires/nouveau?sector=${sector.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-medium"
          >
            <Plus className="size-4" />
            Configurer maintenant
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ── Empty initial selection ────────────────────────────────────── */
function EmptySelection() {
  return (
    <div className="flex items-center justify-center h-full p-10">
      <div className="text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-card border border-border mx-auto mb-4 shadow-subtle">
          <Settings className="size-6 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Sélectionnez un secteur pour voir son formulaire.
        </p>
      </div>
    </div>
  )
}
