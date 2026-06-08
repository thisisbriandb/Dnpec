"use client"

import * as React from "react"
import { useTransition } from "react"
import { toast } from "sonner"
import { Pencil, Settings2, X, Plus as PlusIcon, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { updateSystemSetting } from "@/app/actions/settings"
import { formatDateTime } from "@/lib/format"

/* ── Types ──────────────────────────────────────────────────────── */
export type TableSetting = {
  key: string
  value: unknown
  updated_by: string | null
  updated_at: string
  updater: { full_name: string } | null
}

type ValueKind = "number" | "string_array" | "json"

function detectKind(value: unknown): ValueKind {
  if (typeof value === "number") return "number"
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) return "string_array"
  return "json"
}

function formatValuePreview(value: unknown): string {
  if (typeof value === "number") return String(value)
  if (Array.isArray(value)) return value.join(", ")
  return JSON.stringify(value)
}

/* ── Tag editor for string[] values ───────────────────────────────── */
function TagEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = React.useState("")

  function addTag() {
    const v = draft.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setDraft("")
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-9 rounded-md border border-border bg-surface p-2">
        {value.length === 0 && (
          <span className="text-xs text-muted-foreground/60 italic px-1">Aucune valeur</span>
        )}
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-muted-foreground hover:text-status-bad-text transition-colors"
              aria-label={`Retirer ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addTag() }
          }}
          placeholder="Ajouter une valeur puis Entrée…"
          className="h-8 text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag} className="h-8 gap-1 shrink-0">
          <PlusIcon className="size-3.5" />
          Ajouter
        </Button>
      </div>
    </div>
  )
}

/* ── Edit dialog ──────────────────────────────────────────────────── */
/**
 * Le formulaire est remonté (via `key={setting.key}` côté parent) à chaque
 * changement de paramètre édité : l'état local peut donc être dérivé une
 * seule fois à l'initialisation, sans effet de synchronisation.
 */
function SettingEditForm({
  setting,
  onOpenChange,
  onSaved,
}: {
  setting: TableSetting
  onOpenChange: (open: boolean) => void
  onSaved: (key: string, value: unknown) => void
}) {
  const [isPending, startTransition] = useTransition()
  const kind = detectKind(setting.value)

  const [numberValue, setNumberValue] = React.useState(() =>
    kind === "number" ? String(setting.value) : "0",
  )
  const [tagsValue, setTagsValue] = React.useState<string[]>(() =>
    kind === "string_array" ? [...(setting.value as string[])] : [],
  )
  const [jsonValue, setJsonValue] = React.useState(() =>
    kind === "json" ? JSON.stringify(setting.value, null, 2) : "",
  )
  const [jsonError, setJsonError] = React.useState<string | null>(null)

  function handleSubmit() {
    let nextValue: unknown
    if (kind === "number") {
      const n = Number(numberValue)
      if (!Number.isFinite(n)) { toast.error("La valeur doit être un nombre."); return }
      nextValue = n
    } else if (kind === "string_array") {
      nextValue = tagsValue
    } else {
      try {
        nextValue = JSON.parse(jsonValue)
        setJsonError(null)
      } catch {
        setJsonError("JSON invalide — vérifiez la syntaxe.")
        return
      }
    }

    startTransition(async () => {
      const fd = new FormData()
      fd.append("key", setting.key)
      fd.append("value", JSON.stringify(nextValue))
      const result = await updateSystemSetting(fd)
      if ("error" in result) { toast.error(result.error); return }
      toast.success("Paramètre mis à jour.")
      onOpenChange(false)
      onSaved(setting.key, nextValue)
    })
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="font-mono text-sm">{setting.key}</DialogTitle>
        <DialogDescription>
          Modifiez la valeur de ce paramètre système. Le changement s&apos;applique immédiatement.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        {kind === "number" && (
          <div className="space-y-1.5">
            <Label htmlFor="setting-value">Valeur numérique</Label>
            <Input
              id="setting-value"
              type="number"
              value={numberValue}
              onChange={(e) => setNumberValue(e.target.value)}
            />
          </div>
        )}
        {kind === "string_array" && (
          <div className="space-y-1.5">
            <Label>Liste de valeurs</Label>
            <TagEditor value={tagsValue} onChange={setTagsValue} />
          </div>
        )}
        {kind === "json" && (
          <div className="space-y-1.5">
            <Label htmlFor="setting-json">Valeur (JSON)</Label>
            <Textarea
              id="setting-json"
              value={jsonValue}
              onChange={(e) => { setJsonValue(e.target.value); setJsonError(null) }}
              rows={6}
              className="font-mono text-xs"
            />
            {jsonError && <p className="text-xs text-status-bad-text">{jsonError}</p>}
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="size-3.5 mt-0.5 shrink-0" />
              Type de valeur non reconnu automatiquement — édition au format JSON brut.
            </p>
          </div>
        )}
      </div>

      <DialogFooter className="mt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
          Annuler
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

function SettingEditDialog({
  setting,
  open,
  onOpenChange,
  onSaved,
}: {
  setting: TableSetting | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (key: string, value: unknown) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {setting && (
        <SettingEditForm key={setting.key} setting={setting} onOpenChange={onOpenChange} onSaved={onSaved} />
      )}
    </Dialog>
  )
}

/* ── Main view ────────────────────────────────────────────────────── */
interface Props {
  initialData: TableSetting[]
}

export function SystemSettingsClient({ initialData }: Props) {
  const [data, setData] = React.useState<TableSetting[]>(initialData)
  const [editing, setEditing] = React.useState<TableSetting | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  function openEdit(setting: TableSetting) {
    setEditing(setting)
    setDialogOpen(true)
  }

  function handleSaved(key: string, value: unknown) {
    setData((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value, updated_at: new Date().toISOString() } : s)),
    )
  }

  // Regroupement par préfixe de clé (ex. "auth.xxx" → catégorie "auth")
  const groups = React.useMemo(() => {
    const map = new Map<string, TableSetting[]>()
    for (const s of data) {
      const category = s.key.includes(".") ? s.key.split(".")[0] : "général"
      const list = map.get(category) ?? []
      list.push(s)
      map.set(category, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [data])

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-lg border border-status-info/30 bg-status-info-bg px-3.5 py-3 text-sm text-status-info-text">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          Cet écran permet de <strong>consulter et modifier</strong> les paramètres système existants.
          La création et la suppression de clés ne sont pas proposées ici : du code applicatif peut
          dépendre de ces clés par leur nom — toute évolution du référentiel doit passer par l&apos;équipe technique.
        </span>
      </div>

      {groups.map(([category, settings]) => (
        <div key={category} className="rounded-card border border-border bg-surface shadow-subtle overflow-hidden">
          <div className="border-b border-border bg-surface-2 px-5 py-3 flex items-center gap-2">
            <Settings2 className="size-3.5 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </h2>
          </div>
          <div className="divide-y divide-border">
            {settings.map((s) => (
              <div key={s.key} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm text-foreground truncate">{s.key}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    Valeur actuelle :{" "}
                    <span className="text-foreground font-medium">{formatValuePreview(s.value)}</span>
                  </p>
                  {s.updater && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                      Modifié par {s.updater.full_name} · {formatDateTime(s.updated_at)}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => openEdit(s)}>
                  <Pencil className="size-3.5" />
                  Modifier
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <SettingEditDialog
        setting={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={handleSaved}
      />
    </div>
  )
}
