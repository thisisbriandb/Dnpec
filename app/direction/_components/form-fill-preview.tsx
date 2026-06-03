"use client"

import * as React from "react"
import {
  Upload, Calendar, Hash, AlignLeft, AlignJustify,
  ToggleLeft, ListChecks, List, Table2, Check, FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

export type FormSchema = { sections: FormSection[] }

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

/* ── Fillable field ─────────────────────────────────────────────── */
function FillableField({
  field,
  value,
  onChange,
  readOnly = false,
}: {
  field: FormField
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
  readOnly?: boolean
}) {
  const inputBase =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all duration-150"

  const Label = () => (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="text-sm font-medium text-foreground">{field.label}</span>
      {field.required && <span className="text-red-500 text-sm leading-none">*</span>}
      {field.unit && (
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
          {field.unit}
        </span>
      )}
      <FieldTypeChip type={field.type} />
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
          disabled={readOnly}
          className={cn(inputBase, readOnly && "opacity-70 cursor-not-allowed")}
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
          disabled={readOnly}
          className={cn(inputBase, "resize-y min-h-[96px]", readOnly && "opacity-70 cursor-not-allowed")}
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
            disabled={readOnly}
            className={cn(inputBase, "flex-1", readOnly && "opacity-70 cursor-not-allowed")}
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
          disabled={readOnly}
          className={cn(inputBase, readOnly && "opacity-70 cursor-not-allowed")}
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
                  onClick={() => !readOnly && onChange(key)}
                  disabled={readOnly}
                  className={cn("flex items-center gap-3 text-sm text-foreground w-full text-left group", readOnly && "pointer-events-none opacity-70")}
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
                  onClick={() => !readOnly && toggle(key)}
                  disabled={readOnly}
                  className={cn("flex items-center gap-3 text-sm text-foreground w-full text-left group", readOnly && "pointer-events-none opacity-70")}
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
        onClick={() => !readOnly && onChange(checked ? "false" : "true")}
        disabled={readOnly}
        className={cn("flex items-center gap-3 text-sm font-medium text-foreground group", readOnly && "pointer-events-none opacity-70")}
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

/* ── Section block ──────────────────────────────────────────────── */
function FillableSectionBlock({
  section,
  index,
  values,
  onValueChange,
  readOnly = false,
}: {
  section: FormSection
  index: number
  values: Record<string, string | string[]>
  onValueChange: (key: string, value: string | string[]) => void
  readOnly?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-subtle">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-muted/20">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/15">
          {index + 1}
        </span>
        <h4 className="text-base font-semibold text-foreground">{section.title}</h4>
        <span className="ml-auto text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          {section.fields.length} champ{section.fields.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {section.fields.map((field) => (
          <div key={field.key} className="px-6 py-5">
            <FillableField
              field={field}
              value={values[field.key]}
              onChange={(val) => onValueChange(field.key, val)}
              readOnly={readOnly}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main export ────────────────────────────────────────────────── */
export function FormFillPreview({
  title,
  description,
  schema,
  initialValues,
  onAnswersChange,
  readOnly = false,
}: {
  title: string
  description: string | null
  schema: FormSchema
  initialValues?: Record<string, string | string[]>
  onAnswersChange?: (answers: Record<string, string | string[]>) => void
  readOnly?: boolean
}) {
  const [values, setValues] = React.useState<Record<string, string | string[]>>(
    initialValues ?? {}
  )

  function setValue(key: string, value: string | string[]) {
    setValues((prev) => {
      const next = { ...prev, [key]: value }
      onAnswersChange?.(next)
      return next
    })
  }

  return (
    <div className="space-y-5">
      {/* Title card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-medium">
        <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
        <div className="px-7 py-6">
          <h3 className="text-xl font-semibold text-foreground tracking-tight">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
          )}
          <p className="text-xs text-muted-foreground/60 mt-4 pt-4 border-t border-border/60">
            * Les champs marqués d&apos;un astérisque sont obligatoires.
          </p>
        </div>
      </div>

      {schema.sections.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-10 text-center bg-card">
          <FileText className="size-8 text-muted-foreground/25 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucune section configurée dans ce formulaire.</p>
        </div>
      ) : (
        schema.sections.map((section, i) => (
          <FillableSectionBlock
            key={section.key}
            section={section}
            index={i}
            values={values}
            onValueChange={setValue}
            readOnly={readOnly}
          />
        ))
      )}
    </div>
  )
}
