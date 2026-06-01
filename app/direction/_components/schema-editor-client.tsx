"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2, AlertTriangle, Save, Upload, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { saveFormVersionDraft, publishFormVersion } from "@/app/actions/forms"
import { cn } from "@/lib/utils"

/* ── Types ────────────────────────────────────────────────────── */
export type FormFieldType =
  | "short_text" | "long_text" | "integer" | "decimal" | "date"
  | "single_select" | "multi_select" | "checkbox" | "data_table" | "file"

export interface FormFieldDef {
  key: string
  label: string
  type: FormFieldType
  required: boolean
  unit?: string
  options?: string[]
}

export interface FormSectionDef {
  key: string
  title: string
  fields: FormFieldDef[]
}

export interface FormSchemaPayload {
  sections: FormSectionDef[]
}

/* ── Constants ────────────────────────────────────────────────── */
const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: "short_text",    label: "Texte court" },
  { value: "long_text",     label: "Texte long" },
  { value: "integer",       label: "Nombre entier" },
  { value: "decimal",       label: "Nombre décimal" },
  { value: "date",          label: "Date" },
  { value: "single_select", label: "Sélection unique" },
  { value: "multi_select",  label: "Sélection multiple" },
  { value: "checkbox",      label: "Case à cocher" },
  { value: "data_table",    label: "Tableau de données" },
  { value: "file",          label: "Fichier" },
]

const HAS_UNIT = new Set(["integer", "decimal"])
const HAS_OPTIONS = new Set(["single_select", "multi_select"])

function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 40)
}

function newField(): FormFieldDef {
  return { key: "", label: "", type: "short_text", required: false }
}

function newSection(): FormSectionDef {
  return { key: `section_${Date.now()}`, title: "", fields: [newField()] }
}

/* ── Props ────────────────────────────────────────────────────── */
interface Props {
  templateId: string
  templateTitle: string
  sectorName: string
  existingDraft: { id: string; schema: FormSchemaPayload } | null
  hasCurrentVersion: boolean
  seedSchema: FormSchemaPayload | null
}

export function SchemaEditorClient({
  templateId,
  templateTitle,
  sectorName,
  existingDraft,
  hasCurrentVersion,
  seedSchema,
}: Props) {
  const router = useRouter()
  const initialSections =
    existingDraft?.schema?.sections ?? seedSchema?.sections ?? []

  const [sections, setSections] = React.useState<FormSectionDef[]>(initialSections)
  const [expandedSections, setExpandedSections] = React.useState<Set<number>>(
    new Set(sections.map((_, i) => i)),
  )
  const [draftId, setDraftId] = React.useState<string | null>(existingDraft?.id ?? null)
  const [saving, setSaving] = React.useState(false)
  const [publishOpen, setPublishOpen] = React.useState(false)

  /* ── Section helpers ────────────────────────────────────────── */
  function addSection() {
    const s = newSection()
    setSections((prev) => [...prev, s])
    setExpandedSections((prev) => new Set([...prev, sections.length]))
  }

  function removeSection(idx: number) {
    setSections((prev) => prev.filter((_, i) => i !== idx))
    setExpandedSections((prev) => {
      const next = new Set<number>()
      prev.forEach((i) => { if (i < idx) next.add(i); else if (i > idx) next.add(i - 1) })
      return next
    })
  }

  function toggleSection(idx: number) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function updateSectionTitle(idx: number, title: string) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === idx ? { ...s, title, key: s.key || slugify(title) } : s,
      ),
    )
  }

  /* ── Field helpers ──────────────────────────────────────────── */
  function addField(sectionIdx: number) {
    setSections((prev) =>
      prev.map((s, i) => (i === sectionIdx ? { ...s, fields: [...s.fields, newField()] } : s)),
    )
  }

  function removeField(sectionIdx: number, fieldIdx: number) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx
          ? { ...s, fields: s.fields.filter((_, fi) => fi !== fieldIdx) }
          : s,
      ),
    )
  }

  function updateField(sectionIdx: number, fieldIdx: number, patch: Partial<FormFieldDef>) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx
          ? {
              ...s,
              fields: s.fields.map((f, fi) =>
                fi === fieldIdx
                  ? {
                      ...f,
                      ...patch,
                      key:
                        patch.label !== undefined && f.key === slugify(f.label)
                          ? slugify(patch.label)
                          : patch.key ?? f.key,
                    }
                  : f,
              ),
            }
          : s,
      ),
    )
  }

  /* ── Save / Publish ─────────────────────────────────────────── */
  async function handleSave() {
    setSaving(true)
    const schema: FormSchemaPayload = { sections }
    const result = await saveFormVersionDraft(templateId, draftId, schema)
    setSaving(false)
    if ("error" in result) {
      toast.error(result.error)
    } else {
      setDraftId(result.versionId)
      toast.success("Brouillon enregistré.")
    }
  }

  async function handlePublish() {
    setSaving(true)
    let vid = draftId
    if (!vid) {
      const saveResult = await saveFormVersionDraft(templateId, null, { sections })
      if ("error" in saveResult) { toast.error(saveResult.error); setSaving(false); return }
      vid = saveResult.versionId
      setDraftId(vid)
    }
    const result = await publishFormVersion(templateId, vid)
    setSaving(false)
    if ("error" in result) {
      toast.error(result.error)
    } else {
      toast.success("Version publiée avec succès.")
      router.push(`/direction/formulaires/${templateId}`)
    }
    setPublishOpen(false)
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{sectorName}</p>
          <h1 className="text-sm font-semibold text-foreground truncate">{templateTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="size-3.5" />
            {saving ? "Enregistrement…" : "Enregistrer brouillon"}
          </Button>
          <Button size="sm" onClick={() => setPublishOpen(true)} disabled={saving}>
            <Upload className="size-3.5" />
            Publier
          </Button>
        </div>
      </div>

      {/* 2-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editor */}
        <div className="flex-1 overflow-y-auto border-r border-border p-4 space-y-3">
          {hasCurrentVersion && (
            <div className="flex items-start gap-2 rounded-md border border-status-warn/30 bg-status-warn-bg px-3 py-2.5 text-sm text-status-warn-text">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>La publication <strong>archivera</strong> la version actuellement publiée.</span>
            </div>
          )}

          {sections.map((section, si) => (
            <div key={si} className="rounded-card border border-border bg-surface shadow-subtle">
              {/* Section header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <button
                  type="button"
                  onClick={() => toggleSection(si)}
                  className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                >
                  {expandedSections.has(si) ? (
                    <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSectionTitle(si, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Titre de la section"
                    className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => removeSection(si)}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-status-bad-bg hover:text-status-bad-text transition-colors"
                  aria-label="Supprimer la section"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              {/* Fields */}
              {expandedSections.has(si) && (
                <div className="p-3 space-y-2">
                  {section.fields.map((field, fi) => (
                    <div key={fi} className="rounded-md border border-border bg-background p-3">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Label */}
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Libellé *
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(si, fi, { label: e.target.value })}
                            placeholder="Ex. Production mensuelle"
                            className="mt-0.5 w-full h-7 rounded-control border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground"
                          />
                        </div>
                        {/* Type */}
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Type
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(si, fi, { type: e.target.value as FormFieldType })}
                            className="mt-0.5 w-full h-7 rounded-control border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                          >
                            {FIELD_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        {/* Key */}
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Clé (auto)
                          </label>
                          <input
                            type="text"
                            value={field.key}
                            onChange={(e) => updateField(si, fi, { key: e.target.value })}
                            placeholder="clé_auto"
                            className="mt-0.5 w-full h-7 rounded-control border border-input bg-background px-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground"
                          />
                        </div>
                        {/* Unit (if applicable) */}
                        {HAS_UNIT.has(field.type) && (
                          <div>
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              Unité
                            </label>
                            <input
                              type="text"
                              value={field.unit ?? ""}
                              onChange={(e) => updateField(si, fi, { unit: e.target.value })}
                              placeholder="Ex. tonnes, GNF"
                              className="mt-0.5 w-full h-7 rounded-control border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 placeholder:text-muted-foreground"
                            />
                          </div>
                        )}
                      </div>

                      {/* Options (si select) */}
                      {HAS_OPTIONS.has(field.type) && (
                        <div className="mt-2">
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Options (une par ligne)
                          </label>
                          <textarea
                            value={(field.options ?? []).join("\n")}
                            onChange={(e) =>
                              updateField(si, fi, {
                                options: e.target.value.split("\n").filter((o) => o.trim()),
                              })
                            }
                            rows={3}
                            className="mt-0.5 w-full rounded-control border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 resize-none"
                          />
                        </div>
                      )}

                      {/* Bottom row */}
                      <div className="mt-2 flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(si, fi, { required: e.target.checked })}
                            className="rounded"
                          />
                          Requis
                        </label>
                        <button
                          type="button"
                          onClick={() => removeField(si, fi)}
                          className="rounded p-1 text-muted-foreground hover:bg-status-bad-bg hover:text-status-bad-text transition-colors"
                          aria-label="Supprimer le champ"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addField(si)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Plus className="size-3" />
                    Ajouter un champ
                  </button>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addSection}
            className="flex w-full items-center justify-center gap-1.5 rounded-card border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="size-4" />
            Ajouter une section
          </button>
        </div>

        {/* Right: Preview */}
        <div className="w-80 overflow-y-auto bg-surface-2 p-4 space-y-4 hidden lg:block">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Aperçu
          </p>
          {sections.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune section pour le moment.</p>
          )}
          {sections.map((section, si) => (
            <div key={si} className="rounded-card border border-border bg-surface p-3 space-y-2.5">
              <p className="text-xs font-semibold text-foreground">{section.title || `Section ${si + 1}`}</p>
              {section.fields.map((field, fi) => (
                <FieldPreview key={fi} field={field} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Publish confirm dialog */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publier cette version ?</DialogTitle>
            <DialogDescription>
              {hasCurrentVersion
                ? "La version actuellement publiée sera archivée. Cette action est irréversible."
                : "La version sera marquée comme publiée et disponible pour les campagnes."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handlePublish} disabled={saving}>
              {saving ? "Publication…" : "Confirmer la publication"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── Field preview component ──────────────────────────────────── */
function FieldPreview({ field }: { field: FormFieldDef }) {
  const label = field.label || "Champ sans titre"
  const unit = field.unit ? ` (${field.unit})` : ""

  return (
    <div className="space-y-0.5">
      <label className="text-xs text-muted-foreground">
        {label}{unit}
        {field.required && <span className="ml-0.5 text-status-bad">*</span>}
      </label>
      {field.type === "long_text" ? (
        <textarea
          disabled
          rows={2}
          className="w-full rounded-control border border-input bg-background px-2 py-1 text-xs text-muted-foreground resize-none opacity-60"
        />
      ) : field.type === "single_select" || field.type === "multi_select" ? (
        <select
          disabled
          className="w-full h-7 rounded-control border border-input bg-background px-2 text-xs opacity-60"
        >
          <option>Sélectionner…</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      ) : field.type === "checkbox" ? (
        <label className={cn("flex items-center gap-1.5 text-xs opacity-60 cursor-not-allowed")}>
          <input type="checkbox" disabled /> {label}
        </label>
      ) : field.type === "file" ? (
        <div className="flex h-7 items-center rounded-control border border-dashed border-input px-2 text-xs text-muted-foreground opacity-60">
          Choisir un fichier…
        </div>
      ) : field.type === "date" ? (
        <input
          type="date"
          disabled
          className="w-full h-7 rounded-control border border-input bg-background px-2 text-xs opacity-60"
        />
      ) : (
        <input
          type={field.type === "integer" || field.type === "decimal" ? "number" : "text"}
          disabled
          placeholder="—"
          className="w-full h-7 rounded-control border border-input bg-background px-2 text-xs opacity-60"
        />
      )}
    </div>
  )
}
