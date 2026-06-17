"use client"

import * as React from "react"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Send, ChevronDown, ChevronUp, CheckCircle2, Circle, AlertTriangle, Info, FileText,
  ClipboardList, Layers, Users, CalendarClock, Megaphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormInput, FormSelect } from "@/components/ui/form-field"
import { createCampaign } from "@/app/actions/campaigns"
import { FormFillPreview, type FormSchema } from "@/app/direction/_components/form-fill-preview"
import { cn } from "@/lib/utils"

/* ── Types ─────────────────────────────────────────────────────── */
type SectorOption = {
  id: string
  name: string
  template: { id: string; title: string; schema: FormSchema; description: string | null } | null
}
type Company = { id: string; nif: string; name: string; sector_id: string }

/* ── Zod schema ────────────────────────────────────────────────── */
const campaignSchema = z
  .object({
    title: z.string().min(3, "Titre requis (3 car. min.)"),
    sector_id: z.string().uuid("Secteur requis"),
    reference_period: z.string().min(2, "Période requise (ex. T1-2025)"),
    periodicity: z.enum(["monthly", "quarterly", "annual", "one_off"], {
      message: "Périodicité requise",
    }),
    target_mode: z.enum(["sector", "specific"]),
    target_company_ids: z.array(z.string()).optional(),
    opens_at: z.string().min(1, "Date d'ouverture requise"),
    closes_at: z.string().min(1, "Date de clôture requise"),
  })
  .refine(
    (d) => !d.opens_at || !d.closes_at || new Date(d.closes_at) > new Date(d.opens_at),
    { message: "La clôture doit être après l'ouverture.", path: ["closes_at"] },
  )
  .refine(
    (d) => d.target_mode !== "specific" || (d.target_company_ids?.length ?? 0) > 0,
    { message: "Sélectionnez au moins une entreprise.", path: ["target_company_ids"] },
  )

type CampaignValues = z.infer<typeof campaignSchema>

const PERIODICITY_OPTIONS = [
  { value: "monthly", label: "Mensuelle" },
  { value: "quarterly", label: "Trimestrielle" },
  { value: "annual", label: "Annuelle" },
  { value: "one_off", label: "Ponctuelle" },
]
const PERIODICITY_LABELS: Record<string, string> = Object.fromEntries(
  PERIODICITY_OPTIONS.map((o) => [o.value, o.label]),
)

function formatDateTime(value: string | undefined): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })
}

/* ── Section header ────────────────────────────────────────────── */
function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/15">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  )
}

/* ── Readiness row (sidebar checklist) ────────────────────────────── */
function ReadinessRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {done ? (
        <CheckCircle2 className="size-4 text-status-ok shrink-0" />
      ) : (
        <Circle className="size-4 text-muted-foreground/40 shrink-0" />
      )}
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────── */
interface Props {
  sectors: SectorOption[]
  allCompanies: Company[]
}

export function CampaignCreateForm({ sectors, allCompanies }: Props) {
  const [isPending, startTransition] = useTransition()
  const [previewOpen, setPreviewOpen] = React.useState(false)

  const form = useForm<CampaignValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { title: "", target_mode: "sector", target_company_ids: [] },
  })

  const title         = form.watch("title")
  const referencePeriod = form.watch("reference_period")
  const periodicity   = form.watch("periodicity")
  const opensAt        = form.watch("opens_at")
  const closesAt       = form.watch("closes_at")
  const sectorId       = form.watch("sector_id")
  const targetMode     = form.watch("target_mode")
  const targetCompanyIds = form.watch("target_company_ids") ?? []

  const selectedSector = sectors.find((s) => s.id === sectorId) ?? null
  const sectorCompanies = sectorId ? allCompanies.filter((c) => c.sector_id === sectorId) : []
  const recipientCount = targetMode === "specific" ? targetCompanyIds.length : sectorCompanies.length

  function selectSector(s: SectorOption) {
    if (!s.template) return
    form.setValue("sector_id", s.id, { shouldValidate: true })
    setPreviewOpen(false)
  }

  function onSubmit(values: CampaignValues) {
    if (!selectedSector?.template) {
      toast.error("Ce secteur n'a pas de formulaire publié.")
      return
    }
    startTransition(async () => {
      const fd = new FormData()
      fd.append("title", values.title)
      fd.append("sector_id", values.sector_id)
      fd.append("form_template_id", selectedSector.template!.id)
      fd.append("reference_period", values.reference_period)
      fd.append("periodicity", values.periodicity)
      fd.append("opens_at", new Date(values.opens_at).toISOString())
      fd.append("closes_at", new Date(values.closes_at).toISOString())
      fd.append("target_mode", values.target_mode)
      if (values.target_mode === "specific" && values.target_company_ids) {
        fd.append("target_company_ids", JSON.stringify(values.target_company_ids))
      }

      const result = await createCampaign(fd)
      if (result && "error" in result) toast.error(result.error)
    })
  }

  const readiness = {
    title: title.trim().length >= 3,
    sector: !!selectedSector?.template,
    dates: !!opensAt && !!closesAt && (!opensAt || !closesAt || new Date(closesAt) > new Date(opensAt)),
    recipients: recipientCount > 0,
  }
  const allReady = Object.values(readiness).every(Boolean)

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start"
    >
      {/* ── Left column — form ──────────────────────────────── */}
      <div className="space-y-6 min-w-0">

        {/* Informations générales */}
        <div className="rounded-card border border-border bg-surface p-6 shadow-subtle space-y-5">
          <SectionHeader icon={ClipboardList} title="Informations générales" />

          <FormInput
            control={form.control}
            name="title"
            label="Titre de la campagne"
            required
            placeholder="Ex. Enquête conjoncturelle T1 2025"
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              control={form.control}
              name="reference_period"
              label="Période de référence"
              required
              placeholder="Ex. T1-2025, Janvier 2025"
              hint="Format libre"
            />
            <FormSelect
              control={form.control}
              name="periodicity"
              label="Périodicité"
              required
              options={PERIODICITY_OPTIONS}
            />
          </div>
        </div>

        {/* Secteur ciblé */}
        <div className="rounded-card border border-border bg-surface p-6 shadow-subtle space-y-4">
          <SectionHeader
            icon={Layers}
            title="Secteur ciblé"
            description="Le formulaire publié du secteur sera envoyé aux entreprises ciblées."
          />

          {sectors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun secteur d&apos;activité configuré.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sectors.map((s) => {
                const isSelected = s.id === sectorId
                const disabled = !s.template
                const companyCount = allCompanies.filter((c) => c.sector_id === s.id).length
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectSector(s)}
                    className={cn(
                      "relative flex flex-col items-start gap-2 rounded-xl border px-4 py-3.5 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-subtle ring-1 ring-primary/20"
                        : disabled
                          ? "border-border bg-muted/30 cursor-not-allowed opacity-60"
                          : "border-border bg-background hover:border-primary/40 hover:bg-muted/30 hover:shadow-subtle"
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {s.name.charAt(0).toUpperCase()}
                      </span>
                      <span className={cn("text-sm font-medium truncate", isSelected ? "text-primary" : "text-foreground")}>
                        {s.name}
                      </span>
                      {isSelected && <CheckCircle2 className="size-4 text-primary shrink-0 ml-auto" />}
                    </div>
                    <span className={cn("text-[11px] leading-snug", disabled ? "text-status-warn-text" : "text-muted-foreground")}>
                      {s.template ? s.template.title : "Aucun formulaire publié"}
                      {s.template && ` · ${companyCount} entreprise${companyCount !== 1 ? "s" : ""}`}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {form.formState.errors.sector_id && (
            <p className="text-xs text-status-bad-text">{form.formState.errors.sector_id.message}</p>
          )}

          {/* Diffusion info */}
          {selectedSector?.template && (
            <div className="flex items-center gap-2.5 rounded-lg border border-status-info/25 bg-status-info-bg px-4 py-3 text-sm text-status-info-text">
              <Info className="size-4 shrink-0" />
              {sectorCompanies.length > 0 ? (
                <span>
                  <strong>{sectorCompanies.length}</strong> entreprise{sectorCompanies.length > 1 ? "s" : ""} validée
                  {sectorCompanies.length > 1 ? "s" : ""} du secteur <strong>{selectedSector.name}</strong> recevront
                  le formulaire « {selectedSector.template.title} ».
                </span>
              ) : (
                <span>Aucune entreprise validée dans le secteur <strong>{selectedSector.name}</strong> pour le moment.</span>
              )}
            </div>
          )}

          {/* Form preview toggle */}
          {selectedSector?.template && (
            <div>
              <button
                type="button"
                onClick={() => setPreviewOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <FileText className="size-3.5" />
                {previewOpen ? "Masquer l'aperçu du formulaire" : "Voir l'aperçu du formulaire"}
                {previewOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </button>
              {previewOpen && (
                <div
                  className="mt-3 max-h-[420px] overflow-y-auto rounded-xl border border-border bg-muted/20 p-4"
                  style={{ scrollbarWidth: "thin" }}
                >
                  <FormFillPreview
                    title={selectedSector.template.title}
                    description={selectedSector.template.description}
                    schema={selectedSector.template.schema}
                    readOnly
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Entreprises ciblées */}
        <div className="rounded-card border border-border bg-surface p-6 shadow-subtle space-y-4">
          <SectionHeader icon={Users} title="Entreprises ciblées" />

          <div className="grid grid-cols-2 gap-3">
            {(["sector", "specific"] as const).map((mode) => {
              const isSelected = targetMode === mode
              return (
                <label
                  key={mode}
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl border px-4 py-3 cursor-pointer transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-subtle ring-1 ring-primary/20"
                      : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
                  )}
                >
                  <input type="radio" value={mode} className="mt-0.5" {...form.register("target_mode")} />
                  <span className="text-sm">
                    <span className={cn("font-medium block", isSelected ? "text-primary" : "text-foreground")}>
                      {mode === "sector" ? "Tout le secteur" : "Sélection spécifique"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {mode === "sector"
                        ? `${sectorCompanies.length} entreprise${sectorCompanies.length !== 1 ? "s" : ""} validée${sectorCompanies.length !== 1 ? "s" : ""}`
                        : "Choisir entreprise par entreprise"}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>

          {targetMode === "specific" && (
            <div className="max-h-52 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
              {sectorCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2 py-1">
                  {sectorId ? "Aucune entreprise validée dans ce secteur." : "Sélectionnez d'abord un secteur."}
                </p>
              ) : (
                sectorCompanies.map((c) => {
                  const checked = targetCompanyIds.includes(c.id)
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const current = form.getValues("target_company_ids") ?? []
                          form.setValue(
                            "target_company_ids",
                            e.target.checked
                              ? [...current, c.id]
                              : current.filter((id) => id !== c.id),
                            { shouldValidate: true },
                          )
                        }}
                      />
                      <span className="text-sm flex-1 min-w-0">
                        <span className="font-medium truncate">{c.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground font-mono">{c.nif}</span>
                      </span>
                    </label>
                  )
                })
              )}
            </div>
          )}

          {form.formState.errors.target_company_ids && (
            <p className="text-xs text-status-bad-text">{form.formState.errors.target_company_ids.message}</p>
          )}
        </div>

        {/* Fenêtre temporelle */}
        <div className="rounded-card border border-border bg-surface p-6 shadow-subtle space-y-5">
          <SectionHeader icon={CalendarClock} title="Fenêtre temporelle" />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              control={form.control}
              name="opens_at"
              label="Date d'ouverture"
              required
              type="datetime-local"
            />
            <FormInput
              control={form.control}
              name="closes_at"
              label="Date de clôture"
              required
              type="datetime-local"
            />
          </div>
        </div>
      </div>

      {/* ── Right column — live summary ─────────────────────── */}
      <aside className="sticky top-6 space-y-4">
        <div className="rounded-card border border-border bg-surface shadow-medium overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/15">
                <Megaphone className="size-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Résumé de la campagne</h3>
            </div>

            <div className="space-y-2.5">
              <p className="text-base font-semibold text-foreground leading-snug">
                {title?.trim() ? title : "Nouvelle campagne sans titre"}
              </p>
              {referencePeriod && (
                <p className="text-xs text-muted-foreground">
                  {referencePeriod}
                  {periodicity && ` · ${PERIODICITY_LABELS[periodicity]}`}
                </p>
              )}
            </div>

            <div className="border-t border-border pt-3.5 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Secteur</span>
                <span className="font-medium text-foreground text-right truncate max-w-[60%]">
                  {selectedSector?.name ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Destinataires</span>
                <span className="font-medium text-foreground">
                  {recipientCount} entreprise{recipientCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Ouverture</span>
                <span className="font-medium text-foreground text-right">
                  {formatDateTime(opensAt) ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Clôture</span>
                <span className="font-medium text-foreground text-right">
                  {formatDateTime(closesAt) ?? "—"}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-3.5 space-y-2">
              <ReadinessRow done={readiness.title} label="Titre renseigné" />
              <ReadinessRow done={readiness.sector} label="Secteur avec formulaire publié" />
              <ReadinessRow done={readiness.recipients} label="Destinataires définis" />
              <ReadinessRow done={readiness.dates} label="Fenêtre temporelle valide" />
            </div>

            {!allReady && (
              <div className="flex items-start gap-2 rounded-lg border border-status-warn/25 bg-status-warn-bg px-3 py-2.5 text-xs text-status-warn-text">
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                Complétez les éléments ci-dessus pour lancer la campagne.
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <Button type="submit" disabled={isPending} className="w-full">
                <Send className="size-4" />
                {isPending ? "Création en cours…" : "Créer et programmer"}
              </Button>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => form.reset()} className="w-full">
                Réinitialiser
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </form>
  )
}
