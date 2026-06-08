"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion"
import {
  Plus, Trash2, Save, Upload, ChevronDown, ChevronRight, ChevronUp,
  GripVertical, AlertCircle, AlertTriangle, CheckCircle2, Loader2,
  Layers, ClipboardList, Lock, FileText, Eye, PencilLine,
  AlignLeft, AlignJustify, Hash, Calendar, List, ListChecks, ToggleLeft, Table2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { saveFormSchema, publishFormSchema, createFormTemplate } from "@/app/actions/forms"
import { formatRelative } from "@/lib/format"
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

/* ── Internal editor types ────────────────────────────────────────
   Le payload envoyé au serveur n'a pas besoin d'identifiants stables,
   mais l'UI (animations, glisser-déposer, navigation d'ancrage) si :
   on attache un `_id` interne, dérivé de l'index au chargement puis
   généré côté client pour les éléments ajoutés en cours d'édition.  */
interface EditorField extends FormFieldDef { _id: string }
interface EditorSection extends Omit<FormSectionDef, "fields"> {
  _id: string
  fields: EditorField[]
}

/* ── Constants ────────────────────────────────────────────────── */
const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: "short_text",    label: "Texte court"        },
  { value: "long_text",     label: "Texte long"         },
  { value: "integer",       label: "Nombre entier"      },
  { value: "decimal",       label: "Nombre décimal"     },
  { value: "date",          label: "Date"               },
  { value: "single_select", label: "Sélection unique"   },
  { value: "multi_select",  label: "Sélection multiple" },
  { value: "checkbox",      label: "Case à cocher"      },
  { value: "data_table",    label: "Tableau de données" },
  { value: "file",          label: "Fichier"            },
]

/* Mapping icône ↔ type de champ — cohérent avec FIELD_TYPE_META de
   formulaires-layout-client.tsx pour garder la même grammaire visuelle
   entre l'éditeur et les vues de lecture. */
const FIELD_TYPE_ICON: Record<FormFieldType, React.ElementType> = {
  short_text:    AlignLeft,
  long_text:     AlignJustify,
  integer:       Hash,
  decimal:       Hash,
  date:          Calendar,
  single_select: List,
  multi_select:  ListChecks,
  checkbox:      ToggleLeft,
  data_table:    Table2,
  file:          Upload,
}

const HAS_UNIT    = new Set<FormFieldType>(["integer", "decimal"])
const HAS_OPTIONS = new Set<FormFieldType>(["single_select", "multi_select"])

const FIELD_CONTROL_CLS =
  "w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"

const REORDER_BTN_CLS =
  "flex size-5 items-center justify-center rounded text-muted-foreground/50 hover:bg-muted hover:text-foreground disabled:opacity-25 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1 transition-colors"

function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 40)
}

/* Identifiants internes — déterministes au chargement (mêmes valeurs
   côté serveur et client, donc pas de souci d'hydratation), aléatoires
   pour les éléments créés ensuite (uniquement côté client). */
const sectionIdAt = (si: number) => `section-${si}`
const fieldIdAt   = (si: number, fi: number) => `field-${si}-${fi}`

function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function withInternalIds(sections: FormSectionDef[]): EditorSection[] {
  return sections.map((s, si) => ({
    ...s,
    _id: sectionIdAt(si),
    fields: s.fields.map((f, fi) => ({ ...f, _id: fieldIdAt(si, fi) })),
  }))
}

function stripInternalIds(sections: EditorSection[]): FormSectionDef[] {
  return sections.map((s) => ({
    key:   s.key,
    title: s.title,
    fields: s.fields.map((f) => ({
      key:      f.key,
      label:    f.label,
      type:     f.type,
      required: f.required,
      unit:     f.unit,
      options:  f.options,
    })),
  }))
}

function newField(): EditorField {
  return { _id: makeId("field"), key: "", label: "", type: "short_text", required: false }
}

function newSection(): EditorSection {
  return { _id: makeId("section"), key: `section_${Date.now()}`, title: "", fields: [newField()] }
}

/* ── Validation inline (miroir des contraintes serveur) ───────────
   Le serveur (app/actions/forms.ts) rejette tout schéma dont une
   section ou un champ a une clé/un titre/un libellé vide. On détecte
   ces cas côté client pour guider l'utilisateur avant l'enregistrement
   plutôt que de le laisser découvrir un rejet générique du serveur. */
interface ValidationIssue {
  sectionId: string
  fieldId?:  string
  message:   string
}

function collectIssues(sections: EditorSection[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  sections.forEach((section) => {
    if (!section.title.trim()) {
      issues.push({ sectionId: section._id, message: "Le titre de la section est requis." })
    } else if (!section.key.trim()) {
      issues.push({
        sectionId: section._id,
        message: "Le titre de la section doit contenir au moins une lettre ou un chiffre.",
      })
    }
    section.fields.forEach((field) => {
      if (!field.label.trim()) {
        issues.push({ sectionId: section._id, fieldId: field._id, message: "Le libellé du champ est requis." })
      }
      if (!field.key.trim()) {
        issues.push({ sectionId: section._id, fieldId: field._id, message: "La clé du champ est requise." })
      }
    })
  })
  return issues
}

/* ── Props ────────────────────────────────────────────────────── */
interface Props {
  templateId:    string | null   // null = création d'un nouveau formulaire
  sectorId?:     string          // requis quand templateId est null
  templateTitle: string
  sectorName:    string
  schema:        FormSchemaPayload
}

export function SchemaEditorClient({
  templateId: initialTemplateId,
  sectorId,
  templateTitle,
  sectorName,
  schema,
}: Props) {
  const router = useRouter()
  const [sections, setSections] = React.useState<EditorSection[]>(() => withInternalIds(schema.sections))
  const [expandedSections, setExpanded] = React.useState<Set<string>>(
    () => new Set(schema.sections.map((_, si) => sectionIdAt(si))),
  )
  const [saving, setSaving]               = React.useState(false)
  const [creatingTemplate, setCreating]    = React.useState(false)
  const [publishOpen, setPublishOpen]      = React.useState(false)
  const [mobileView, setMobileView]        = React.useState<"editor" | "preview">("editor")
  // templateId peut démarrer null (création) et être défini après le premier save
  const [templateId, setTemplateId]       = React.useState<string | null>(initialTemplateId)

  /* Suivi « modifications non enregistrées » : on marque `dirty` dès que
     le schéma change après le montage initial, et on le lève après un
     enregistrement réussi. */
  const mountedRef = React.useRef(false)
  const [dirty, setDirty]           = React.useState(false)
  const [lastSavedAt, setLastSaved] = React.useState<Date | null>(null)

  React.useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    setDirty(true)
  }, [sections])

  const sectionRefs = React.useRef(new Map<string, HTMLDivElement>())

  function registerSectionRef(id: string) {
    return (el: HTMLDivElement | null) => {
      if (el) sectionRefs.current.set(id, el)
      else sectionRefs.current.delete(id)
    }
  }

  function jumpToSection(id: string) {
    setExpanded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
    setMobileView("editor")
    requestAnimationFrame(() => {
      sectionRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  /* ── Section helpers ──────────────────────────────────────────── */
  function addSection() {
    const s = newSection()
    setSections((prev) => [...prev, s])
    setExpanded((prev) => new Set(prev).add(s._id))
    requestAnimationFrame(() => {
      sectionRefs.current.get(s._id)?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }

  function removeSection(id: string) {
    setSections((prev) => prev.filter((s) => s._id !== id))
    setExpanded((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function toggleSection(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function updateSectionTitle(id: string, title: string) {
    setSections((prev) =>
      prev.map((s) => (s._id === id ? { ...s, title, key: s.key || slugify(title) } : s)),
    )
  }

  function moveSection(id: string, direction: -1 | 1) {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s._id === id)
      const target = idx + direction
      if (idx < 0 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  /* ── Field helpers ────────────────────────────────────────────── */
  function addField(sectionId: string) {
    const f = newField()
    setSections((prev) =>
      prev.map((s) => (s._id === sectionId ? { ...s, fields: [...s.fields, f] } : s)),
    )
  }

  function removeField(sectionId: string, fieldId: string) {
    setSections((prev) =>
      prev.map((s) =>
        s._id === sectionId ? { ...s, fields: s.fields.filter((f) => f._id !== fieldId) } : s,
      ),
    )
  }

  function updateField(sectionId: string, fieldId: string, patch: Partial<FormFieldDef>) {
    setSections((prev) =>
      prev.map((s) =>
        s._id !== sectionId ? s : {
          ...s,
          fields: s.fields.map((f) =>
            f._id !== fieldId ? f : {
              ...f,
              ...patch,
              key:
                patch.label !== undefined && f.key === slugify(f.label)
                  ? slugify(patch.label)
                  : (patch.key ?? f.key),
            },
          ),
        },
      ),
    )
  }

  function moveField(sectionId: string, fieldId: string, direction: -1 | 1) {
    setSections((prev) =>
      prev.map((s) => {
        if (s._id !== sectionId) return s
        const idx = s.fields.findIndex((f) => f._id === fieldId)
        const target = idx + direction
        if (idx < 0 || target < 0 || target >= s.fields.length) return s
        const fields = [...s.fields]
        const [item] = fields.splice(idx, 1)
        fields.splice(target, 0, item)
        return { ...s, fields }
      }),
    )
  }

  function reorderFields(sectionId: string, fields: EditorField[]) {
    setSections((prev) => prev.map((s) => (s._id === sectionId ? { ...s, fields } : s)))
  }

  /* ── Validation avant enregistrement ──────────────────────────── */
  function ensureValid(): boolean {
    const issues = collectIssues(sections)
    if (issues.length === 0) return true

    setExpanded((prev) => {
      const next = new Set(prev)
      issues.forEach((issue) => next.add(issue.sectionId))
      return next
    })
    toast.error(
      issues.length === 1
        ? "Un élément doit être complété avant l'enregistrement (titre, libellé ou clé manquant)."
        : `${issues.length} éléments doivent être complétés avant l'enregistrement (titres, libellés ou clés manquants).`,
    )
    return false
  }

  /* ── Save / Publish ───────────────────────────────────────────── */
  async function resolveTemplateId(): Promise<string | null> {
    if (templateId) return templateId
    if (!sectorId) return null
    setCreating(true)
    const result = await createFormTemplate(sectorId, { sections: stripInternalIds(sections) })
    setCreating(false)
    if ("error" in result) { toast.error(result.error); return null }
    setTemplateId(result.templateId)
    setDirty(false)
    setLastSaved(new Date())
    router.replace(`/direction/formulaires/${result.templateId}/modifier`)
    return result.templateId
  }

  async function handleSave() {
    if (!ensureValid()) return
    setSaving(true)
    const tid = await resolveTemplateId()
    if (!tid) { setSaving(false); return }
    if (tid !== templateId) { setSaving(false); return } // déjà redirigé après création
    const result = await saveFormSchema(tid, { sections: stripInternalIds(sections) })
    setSaving(false)
    if ("error" in result) {
      toast.error(result.error)
    } else {
      toast.success("Formulaire enregistré.")
      setDirty(false)
      setLastSaved(new Date())
    }
  }

  async function handlePublish() {
    if (!ensureValid()) { setPublishOpen(false); return }
    setSaving(true)
    const tid = await resolveTemplateId()
    if (!tid) { setSaving(false); return }
    const result = await publishFormSchema(tid, { sections: stripInternalIds(sections) })
    setSaving(false)
    if ("error" in result) {
      toast.error(result.error)
    } else {
      toast.success("Formulaire publié avec succès.")
      router.push(`/direction/formulaires`)
    }
    setPublishOpen(false)
  }

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="border-b border-border bg-background px-4 py-3.5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <FileText className="size-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                  {sectorName}
                </span>
                <StatusBadge status="draft" size="sm" />
              </div>
              <h1 className="mt-0.5 truncate text-base font-semibold text-foreground">{templateTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SaveStatusIndicator saving={saving} dirty={dirty} lastSavedAt={lastSavedAt} />
            <div className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
              <Button size="sm" onClick={() => setPublishOpen(true)} disabled={saving}>
                <Upload className="size-3.5" />
                Publier
              </Button>
            </div>
          </div>
        </div>

        <SectionNav sections={sections} onJump={jumpToSection} />
      </div>

      {/* Bascule éditeur / aperçu — visible uniquement sous lg, où les
          deux panneaux ne peuvent pas être affichés côte à côte. */}
      <div className="flex items-center gap-1 border-b border-border bg-surface px-4 py-2 lg:hidden">
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
          <button
            type="button"
            onClick={() => setMobileView("editor")}
            aria-pressed={mobileView === "editor"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1",
              mobileView === "editor"
                ? "bg-primary text-primary-foreground shadow-subtle"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <PencilLine className="size-3.5" />
            Édition
          </button>
          <button
            type="button"
            onClick={() => setMobileView("preview")}
            aria-pressed={mobileView === "preview"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1",
              mobileView === "preview"
                ? "bg-primary text-primary-foreground shadow-subtle"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Eye className="size-3.5" />
            Aperçu
          </button>
        </div>
      </div>

      {/* 2-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left : Editor */}
        <div
          className={cn(
            "relative flex-1 overflow-y-auto border-r border-border",
            mobileView === "preview" && "hidden lg:block",
          )}
        >
          <div className="mx-auto max-w-3xl space-y-3 p-4 sm:p-6 lg:mx-0">
            {sections.length === 0 ? (
              <SectionsEmptyState onAdd={addSection} />
            ) : (
              <Reorder.Group as="div" axis="y" values={sections} onReorder={setSections} className="space-y-3">
                {sections.map((section, si) => (
                  <SectionCard
                    key={section._id}
                    section={section}
                    index={si}
                    total={sections.length}
                    isExpanded={expandedSections.has(section._id)}
                    registerRef={registerSectionRef(section._id)}
                    onToggle={toggleSection}
                    onTitleChange={updateSectionTitle}
                    onRemove={removeSection}
                    onMoveUp={(id) => moveSection(id, -1)}
                    onMoveDown={(id) => moveSection(id, 1)}
                    onAddField={addField}
                    onRemoveField={removeField}
                    onUpdateField={updateField}
                    onMoveField={moveField}
                    onReorderFields={reorderFields}
                  />
                ))}
              </Reorder.Group>
            )}

            {sections.length > 0 && (
              <button
                type="button"
                onClick={addSection}
                className="flex w-full items-center justify-center gap-1.5 rounded-card border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
              >
                <Plus className="size-4" />
                Ajouter une section
              </button>
            )}
          </div>

          {/* Surcouche de chargement lors de la création initiale du template
              (premier enregistrement d'un formulaire « nouveau ») */}
          <AnimatePresence>
            {creatingTemplate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[2px]"
              >
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-5 shadow-medium">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">Création du formulaire…</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right : Preview */}
        <div
          className={cn(
            "w-full overflow-y-auto bg-surface-2 lg:w-[26rem] xl:w-[28rem]",
            mobileView === "editor" && "hidden lg:block",
          )}
        >
          <PreviewPane sections={sections} templateTitle={templateTitle} />
        </div>
      </div>

      {/* Publish confirm dialog */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-status-warn/30 bg-status-warn-bg text-status-warn-text">
                <Lock className="size-[18px]" />
              </div>
              <div className="space-y-1.5">
                <DialogTitle>Publier ce formulaire ?</DialogTitle>
                <DialogDescription>
                  Le formulaire sera marqué comme publié et mis à disposition pour les campagnes
                  de collecte. Une fois publié, il sera{" "}
                  <strong className="font-semibold text-foreground">verrouillé définitivement</strong>{" "}
                  : ni les sections, ni les champs ne pourront plus être modifiés.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex items-start gap-2.5 rounded-lg border border-status-warn/25 bg-status-warn-bg/50 px-3.5 py-3 text-xs text-status-warn-text">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Relisez attentivement les sections, champs et options avant de continuer :
              cette action est irréversible.
            </span>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handlePublish} disabled={saving}>
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              {saving ? "Publication…" : "Publier définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── Indicateur d'enregistrement ──────────────────────────────────
   « Enregistré il y a 2 min » / « Modifications non enregistrées » :
   se met à jour toutes les 30 s pour rafraîchir le temps relatif. */
function SaveStatusIndicator({
  saving,
  dirty,
  lastSavedAt,
}: {
  saving: boolean
  dirty: boolean
  lastSavedAt: Date | null
}) {
  const [, retick] = React.useReducer((n: number) => n + 1, 0)

  React.useEffect(() => {
    const id = setInterval(retick, 30_000)
    return () => clearInterval(id)
  }, [])

  if (saving) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Enregistrement…
      </span>
    )
  }
  if (dirty) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-warn-text">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-warn opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-status-warn" />
        </span>
        Modifications non enregistrées
      </span>
    )
  }
  if (lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 className="size-3.5 text-status-ok" />
        Enregistré {formatRelative(lastSavedAt)}
      </span>
    )
  }
  return <span className="text-xs text-muted-foreground/70">Pas encore enregistré</span>
}

/* ── Sommaire / navigation d'ancrage ──────────────────────────────
   Liste horizontale des sections avec compteur de champs ; clique
   pour déplier et faire défiler jusqu'à la section visée. */
function SectionNav({
  sections,
  onJump,
}: {
  sections: EditorSection[]
  onJump: (id: string) => void
}) {
  if (sections.length === 0) return null
  return (
    <nav aria-label="Sommaire des sections du formulaire" className="-mb-0.5 mt-3 flex items-center gap-1.5 overflow-x-auto pb-1.5">
      {sections.map((section, i) => (
        <button
          key={section._id}
          type="button"
          onClick={() => onJump(section._id)}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1"
        >
          <span className="flex size-4 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground transition-colors group-hover:bg-primary/15 group-hover:text-primary">
            {i + 1}
          </span>
          <span className="max-w-[9rem] truncate font-medium text-foreground/80 group-hover:text-foreground">
            {section.title || `Section ${i + 1}`}
          </span>
          <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground/80">
            {section.fields.length}
          </span>
        </button>
      ))}
    </nav>
  )
}

/* ── État vide : aucune section ───────────────────────────────────
   Cohérent avec NoSectors de formulaires-layout-client.tsx : icône
   dans un cadre pointillé, accroche, description, CTA primaire. */
function SectionsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-card border-2 border-dashed border-border bg-surface/60 px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-border bg-card shadow-subtle">
        <Layers className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
      </div>
      <h3 className="mb-1.5 text-sm font-semibold text-foreground">Aucune section pour le moment</h3>
      <p className="mx-auto mb-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Structurez votre formulaire en sections thématiques — par exemple « Informations
        générales », « Production » ou « Emploi » — pour guider les entreprises lors de la saisie.
      </p>
      <Button onClick={onAdd}>
        <Plus className="size-4" />
        Créer la première section
      </Button>
    </div>
  )
}

/* ── État vide : aucun champ dans une section ─────────────────────*/
function FieldsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 px-4 py-8 text-center">
      <ClipboardList className="mx-auto mb-2 size-5 text-muted-foreground/35" strokeWidth={1.5} />
      <p className="mb-3.5 text-sm text-muted-foreground">Cette section ne contient encore aucun champ.</p>
      <Button variant="outline" size="sm" onClick={onAdd}>
        <Plus className="size-3.5" />
        Ajouter un champ
      </Button>
    </div>
  )
}

/* ── Carte de section ─────────────────────────────────────────────
   Glisser-déposer (poignée + Reorder.Item), boutons monter/descendre
   pour le clavier, expand/collapse animé, validation inline du titre. */
interface SectionCardProps {
  section:     EditorSection
  index:       number
  total:       number
  isExpanded:  boolean
  registerRef: (el: HTMLDivElement | null) => void
  onToggle:       (id: string) => void
  onTitleChange:  (id: string, title: string) => void
  onRemove:       (id: string) => void
  onMoveUp:       (id: string) => void
  onMoveDown:     (id: string) => void
  onAddField:      (sectionId: string) => void
  onRemoveField:   (sectionId: string, fieldId: string) => void
  onUpdateField:   (sectionId: string, fieldId: string, patch: Partial<FormFieldDef>) => void
  onMoveField:     (sectionId: string, fieldId: string, direction: -1 | 1) => void
  onReorderFields: (sectionId: string, fields: EditorField[]) => void
}

function SectionCard({
  section, index, total, isExpanded, registerRef,
  onToggle, onTitleChange, onRemove, onMoveUp, onMoveDown,
  onAddField, onRemoveField, onUpdateField, onMoveField, onReorderFields,
}: SectionCardProps) {
  const dragControls = useDragControls()
  const titleMissing = !section.title.trim()
  const sectionLabel = section.title || `Section ${index + 1}`

  return (
    <Reorder.Item
      ref={registerRef}
      value={section}
      as="div"
      layout="position"
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        "group rounded-card border bg-surface shadow-subtle transition-[box-shadow,border-color] duration-200",
        "focus-within:border-primary/35 focus-within:shadow-medium",
        isExpanded ? "border-primary/20 shadow-medium" : "border-border",
      )}
    >
      {/* Section header */}
      <div className="flex items-center gap-1 px-2.5 py-2.5 sm:gap-1.5 sm:px-4">
        <div
          onPointerDown={(e) => dragControls.start(e)}
          aria-hidden="true"
          title="Glisser pour réordonner la section"
          className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </div>

        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            onClick={() => onMoveUp(section._id)}
            disabled={index === 0}
            aria-label={`Monter la section « ${sectionLabel} »`}
            className={REORDER_BTN_CLS}
          >
            <ChevronUp className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(section._id)}
            disabled={index === total - 1}
            aria-label={`Descendre la section « ${sectionLabel} »`}
            className={REORDER_BTN_CLS}
          >
            <ChevronDown className="size-3" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onToggle(section._id)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Réduire la section « ${sectionLabel} »` : `Développer la section « ${sectionLabel} »`}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1"
        >
          <motion.span animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.18, ease: "easeInOut" }} className="flex">
            <ChevronRight className="size-4" />
          </motion.span>
        </button>

        <span className="hidden shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/10 text-[11px] font-bold text-primary sm:inline-flex sm:size-6">
          {index + 1}
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <input
            type="text"
            value={section.title}
            onChange={(e) => onTitleChange(section._id, e.target.value)}
            placeholder="Titre de la section"
            aria-label="Titre de la section"
            aria-invalid={titleMissing}
            className="-mx-1 min-w-0 flex-1 rounded px-1 py-1 text-sm font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          {titleMissing && (
            <span className="hidden items-center gap-1 text-[11px] font-medium text-status-bad-text sm:inline-flex">
              <AlertCircle className="size-3" />
              Titre requis
            </span>
          )}
        </div>

        <span className="hidden shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-flex">
          {section.fields.length} champ{section.fields.length !== 1 ? "s" : ""}
        </span>

        <button
          type="button"
          onClick={() => onRemove(section._id)}
          aria-label={`Supprimer la section « ${sectionLabel} »`}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-status-bad-bg hover:text-status-bad-text focus-visible:outline-2 focus-visible:outline-status-bad focus-visible:outline-offset-1"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* Fields — expand/collapse animé (hauteur + opacité) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: "hidden" }}
          >
            <div className="space-y-2.5 border-t border-border/70 px-2.5 py-3 sm:px-4">
              {section.fields.length === 0 ? (
                <FieldsEmptyState onAdd={() => onAddField(section._id)} />
              ) : (
                <Reorder.Group
                  as="div"
                  axis="y"
                  values={section.fields}
                  onReorder={(fields) => onReorderFields(section._id, fields)}
                  className="space-y-2.5"
                >
                  {section.fields.map((field, fi) => (
                    <FieldCard
                      key={field._id}
                      field={field}
                      sectionId={section._id}
                      index={fi}
                      total={section.fields.length}
                      onRemove={onRemoveField}
                      onUpdate={onUpdateField}
                      onMove={onMoveField}
                    />
                  ))}
                </Reorder.Group>
              )}

              <button
                type="button"
                onClick={() => onAddField(section._id)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
              >
                <Plus className="size-3.5" />
                Ajouter un champ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}

/* ── Carte de champ ───────────────────────────────────────────────
   Icône par type, contrôles agrandis, validation inline (libellé/clé),
   poignée de glisser-déposer + boutons monter/descendre. */
interface FieldCardProps {
  field:    EditorField
  sectionId: string
  index:    number
  total:    number
  onRemove: (sectionId: string, fieldId: string) => void
  onUpdate: (sectionId: string, fieldId: string, patch: Partial<FormFieldDef>) => void
  onMove:   (sectionId: string, fieldId: string, direction: -1 | 1) => void
}

function FieldCard({ field, sectionId, index, total, onRemove, onUpdate, onMove }: FieldCardProps) {
  const dragControls = useDragControls()
  const Icon         = FIELD_TYPE_ICON[field.type] ?? AlignLeft
  const labelMissing = !field.label.trim()
  const keyMissing   = !field.key.trim()
  const fieldLabel   = field.label || `Champ ${index + 1}`

  return (
    <Reorder.Item
      value={field}
      as="div"
      layout="position"
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        "group/field rounded-xl border bg-background p-3 transition-colors duration-150 sm:p-3.5",
        "focus-within:border-primary/35 focus-within:shadow-subtle",
        (labelMissing || keyMissing) ? "border-status-bad/35" : "border-border",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
          <div
            onPointerDown={(e) => dragControls.start(e)}
            aria-hidden="true"
            title="Glisser pour réordonner le champ"
            className="flex size-6 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/35 transition-colors hover:bg-muted hover:text-muted-foreground active:cursor-grabbing"
          >
            <GripVertical className="size-3.5" />
          </div>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => onMove(sectionId, field._id, -1)}
              disabled={index === 0}
              aria-label={`Monter le champ « ${fieldLabel} »`}
              className={REORDER_BTN_CLS}
            >
              <ChevronUp className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => onMove(sectionId, field._id, 1)}
              disabled={index === total - 1}
              aria-label={`Descendre le champ « ${fieldLabel} »`}
              className={REORDER_BTN_CLS}
            >
              <ChevronDown className="size-3" />
            </button>
          </div>
        </div>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted text-muted-foreground" aria-hidden="true">
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <FieldEditorRow label="Libellé" required error={labelMissing ? "Le libellé est requis." : undefined}>
              <input
                type="text"
                value={field.label}
                onChange={(e) => onUpdate(sectionId, field._id, { label: e.target.value })}
                placeholder="Ex. Production mensuelle"
                aria-invalid={labelMissing}
                className={cn(FIELD_CONTROL_CLS, "h-9")}
              />
            </FieldEditorRow>

            <FieldEditorRow label="Type">
              <select
                value={field.type}
                onChange={(e) => onUpdate(sectionId, field._id, { type: e.target.value as FormFieldType })}
                className={cn(FIELD_CONTROL_CLS, "h-9")}
              >
                {FIELD_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FieldEditorRow>

            <FieldEditorRow label="Clé (auto)" required error={keyMissing ? "La clé est requise." : undefined}>
              <input
                type="text"
                value={field.key}
                onChange={(e) => onUpdate(sectionId, field._id, { key: e.target.value })}
                placeholder="clé_auto"
                aria-invalid={keyMissing}
                className={cn(FIELD_CONTROL_CLS, "h-9 font-mono text-xs")}
              />
            </FieldEditorRow>

            {HAS_UNIT.has(field.type) && (
              <FieldEditorRow label="Unité">
                <input
                  type="text"
                  value={field.unit ?? ""}
                  onChange={(e) => onUpdate(sectionId, field._id, { unit: e.target.value })}
                  placeholder="Ex. tonnes, GNF"
                  className={cn(FIELD_CONTROL_CLS, "h-9")}
                />
              </FieldEditorRow>
            )}
          </div>

          {HAS_OPTIONS.has(field.type) && (
            <FieldEditorRow label="Options (une par ligne)">
              <textarea
                value={(field.options ?? []).join("\n")}
                onChange={(e) =>
                  onUpdate(sectionId, field._id, {
                    options: e.target.value.split("\n").filter((o) => o.trim()),
                  })
                }
                rows={3}
                className={cn(FIELD_CONTROL_CLS, "resize-none py-2")}
              />
            </FieldEditorRow>
          )}

          <div className="flex items-center justify-between border-t border-border/50 pt-2">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground/70 select-none">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onUpdate(sectionId, field._id, { required: e.target.checked })}
                className="size-3.5 rounded border-input focus-visible:ring-2 focus-visible:ring-ring/30"
              />
              Champ requis
            </label>
            <button
              type="button"
              onClick={() => onRemove(sectionId, field._id)}
              aria-label={`Supprimer le champ « ${fieldLabel} »`}
              className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-status-bad-bg hover:text-status-bad-text focus-visible:outline-2 focus-visible:outline-status-bad focus-visible:outline-offset-1"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Reorder.Item>
  )
}

/* ── Ligne label + contrôle + erreur inline ───────────────────────
   `<label>` enveloppe le contrôle : association implicite, pas besoin
   d'identifiants appariés. Contraste relevé (foreground/70 ≈ 6:1)
   par rapport au muted-foreground d'origine (≈ 4.4:1, sous le seuil AA). */
function FieldEditorRow({
  label,
  required,
  error,
  children,
}: {
  label:    string
  required?: boolean
  error?:   string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-foreground/70">
        {label}
        {required && <span className="text-status-bad" aria-hidden="true">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-status-bad-text">
          <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
          {error}
        </span>
      )}
    </label>
  )
}

/* ── Aperçu en direct ──────────────────────────────────────────────
   Rendu façon « vrai formulaire » (cartes numérotées, contrôles
   réalistes mais inertes), aligné sur ReadOnlySectionBlock /
   ReadOnlyField de formulaires-layout-client.tsx. */
function PreviewPane({ sections, templateTitle }: { sections: EditorSection[]; templateTitle: string }) {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <Eye className="size-3.5" />
        Aperçu en direct
      </div>

      {sections.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-surface px-5 py-12 text-center">
          <FileText className="mx-auto mb-2 size-6 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            L&apos;aperçu du formulaire apparaîtra ici au fur et à mesure de votre construction.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-subtle">
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
            <div className="px-5 py-4">
              <h3 className="truncate text-base font-semibold tracking-tight text-foreground">{templateTitle}</h3>
              <p className="mt-2 text-[11px] text-muted-foreground/70">
                * Les champs marqués d&apos;un astérisque sont obligatoires.
              </p>
            </div>
          </div>

          {sections.map((section, si) => (
            <PreviewSectionCard key={section._id} section={section} index={si} />
          ))}
        </>
      )}
    </div>
  )
}

function PreviewSectionCard({ section, index }: { section: EditorSection; index: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-subtle">
      <div className="flex items-center gap-3 border-b border-border bg-muted/20 px-5 py-3.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-xs font-bold text-primary">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{section.title || `Section ${index + 1}`}</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            {section.fields.length} champ{section.fields.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {section.fields.length === 0 ? (
        <p className="px-5 py-5 text-xs text-muted-foreground/60 italic">Aucun champ pour le moment.</p>
      ) : (
        <div className="divide-y divide-border/50">
          {section.fields.map((field) => (
            <div key={field._id} className="px-5 py-4">
              <PreviewField field={field} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PreviewField({ field }: { field: EditorField }) {
  const Icon  = FIELD_TYPE_ICON[field.type] ?? AlignLeft
  const label = field.label || "Champ sans titre"
  const disabledCls =
    "w-full rounded-lg border border-input/70 bg-muted/30 px-3 py-2 text-sm text-foreground/40 cursor-not-allowed placeholder:text-muted-foreground/30"

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground/70" aria-hidden="true">
          <Icon className="size-3.5" />
        </span>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {field.required && <span className="text-sm leading-none text-status-bad">*</span>}
        {field.unit && (
          <span className="rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {field.unit}
          </span>
        )}
      </div>
      <PreviewControl field={field} disabledCls={disabledCls} />
    </div>
  )
}

function PreviewControl({ field, disabledCls }: { field: EditorField; disabledCls: string }) {
  switch (field.type) {
    case "long_text":
      return <textarea disabled rows={3} placeholder="Réponse longue…" className={cn(disabledCls, "resize-none")} />

    case "integer":
    case "decimal":
      return (
        <input
          type="number"
          disabled
          placeholder={field.type === "decimal" ? "0,00" : "0"}
          className={disabledCls}
        />
      )

    case "date":
      return <input type="date" disabled className={disabledCls} />

    case "single_select":
    case "multi_select": {
      const options = field.options ?? []
      if (options.length === 0) {
        return <p className="text-xs italic text-muted-foreground/60">Aucune option configurée</p>
      }
      return (
        <div className="space-y-2">
          {options.map((opt) => (
            <div key={opt} className="flex cursor-not-allowed items-center gap-3 text-sm text-foreground/50 select-none">
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center border-2 border-input/60 bg-muted/40",
                  field.type === "multi_select" ? "rounded" : "rounded-full",
                )}
              />
              <span>{opt}</span>
            </div>
          ))}
        </div>
      )
    }

    case "checkbox":
      return (
        <div className="flex cursor-not-allowed items-center gap-3 text-sm text-foreground/50 select-none">
          <span className="flex size-4 shrink-0 items-center justify-center rounded border-2 border-input/60 bg-muted/40" />
          <span>{field.label || "Champ sans titre"}</span>
        </div>
      )

    case "file":
      return (
        <div className="flex cursor-not-allowed items-center gap-3 rounded-lg border-2 border-dashed border-input/60 bg-muted/20 px-4 py-3.5">
          <Upload className="size-4 shrink-0 text-muted-foreground/30" />
          <span className="text-sm text-muted-foreground/50">Fichier à joindre</span>
        </div>
      )

    case "data_table":
      return (
        <div className="overflow-hidden rounded-lg border border-input/70 bg-muted/20">
          <div className="flex border-b border-input/60 bg-muted/50">
            {["Colonne 1", "Colonne 2", "Colonne 3"].map((col, i) => (
              <div
                key={col}
                className={cn(
                  "flex-1 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60",
                  i > 0 && "border-l border-input/60",
                )}
              >
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

    default:
      return <input type="text" disabled placeholder="Réponse courte" className={disabledCls} />
  }
}
