"use client"

import * as React from "react"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Check, ChevronRight, Megaphone } from "lucide-react"
import { createClient } from "@/app/lib/supabase/browser"
import { Button } from "@/components/ui/button"
import { FormInput, FormSelect } from "@/components/ui/form-field"
import { EmptyState } from "@/components/ui/empty-state"
import { Stepper } from "@/components/ui/stepper"
import { createCampaign } from "@/app/actions/campaigns"
import { formatDate } from "@/lib/format"

/* ── Types ────────────────────────────────────────────────────── */
type Sector = { id: string; name: string }
type Company = { id: string; nif: string; name: string; sector_id: string }
type FormVersion = { id: string; version_number: number; published_at: string | null }

/* ── Zod schemas ──────────────────────────────────────────────── */
const step1Schema = z.object({
  title: z.string().min(3, "Titre requis (3 car. min.)"),
  sector_id: z.string().uuid("Secteur requis"),
  reference_period: z.string().min(2, "Période requise (ex. T1-2025)"),
  periodicity: z.enum(["monthly", "quarterly", "annual", "one_off"]),
})

const step2Schema = z.object({
  form_version_id: z.string().uuid("Sélectionnez une version publiée"),
})

const step3Schema = z
  .object({
    target_mode: z.enum(["sector", "specific"]),
    target_company_ids: z.array(z.string()).optional(),
    opens_at: z.string().min(1, "Date d'ouverture requise"),
    closes_at: z.string().min(1, "Date de clôture requise"),
  })
  .refine((d) => !d.opens_at || !d.closes_at || new Date(d.closes_at) > new Date(d.opens_at), {
    message: "La clôture doit être après l'ouverture.",
    path: ["closes_at"],
  })

type Step1Values = z.infer<typeof step1Schema>
type Step2Values = z.infer<typeof step2Schema>
type Step3Values = z.infer<typeof step3Schema>

const PERIODICITY_OPTIONS = [
  { value: "monthly", label: "Mensuelle" },
  { value: "quarterly", label: "Trimestrielle" },
  { value: "annual", label: "Annuelle" },
  { value: "one_off", label: "Ponctuelle" },
]

const STEPPER_STEPS = [
  { id: "infos", label: "Informations", description: "Titre, secteur, période" },
  { id: "formulaire", label: "Formulaire", description: "Sélection de la version" },
  { id: "cibles", label: "Cibles & Dates", description: "Entreprises et fenêtre temporelle" },
  { id: "confirmation", label: "Confirmation", description: "Vérification et création" },
]

/* ── Props ────────────────────────────────────────────────────── */
interface Props {
  sectors: Sector[]
  allCompanies: Company[]
}

export function CampaignStepperClient({ sectors, allCompanies }: Props) {
  const [step, setStep] = React.useState(0)
  const [isPending, startTransition] = useTransition()
  const [step1Data, setStep1Data] = React.useState<Step1Values | null>(null)
  const [step2Data, setStep2Data] = React.useState<Step2Values | null>(null)
  const [step3Data, setStep3Data] = React.useState<Step3Values | null>(null)
  const [availableVersions, setAvailableVersions] = React.useState<FormVersion[]>([])
  const [loadingVersions, setLoadingVersions] = React.useState(false)

  /* ── Step forms ─────────────────────────────────────────────── */
  const form1 = useForm<Step1Values>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2Values>({ resolver: zodResolver(step2Schema) })
  const form3 = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: { target_mode: "sector", target_company_ids: [] },
  })

  const sectorOptions = sectors.map((s) => ({ value: s.id, label: s.name }))

  /* ── Step 1 submit ──────────────────────────────────────────── */
  async function onStep1Submit(values: Step1Values) {
    setStep1Data(values)
    setLoadingVersions(true)

    try {
      const supabase = createClient()
      const { data: tpl } = await supabase
        .from("form_templates")
        .select("id")
        .eq("sector_id", values.sector_id)
        .single()

      if (tpl) {
        const { data: versions } = await supabase
          .from("form_versions")
          .select("id, version_number, published_at")
          .eq("template_id", tpl.id)
          .eq("status", "published")
          .order("version_number", { ascending: false })
        setAvailableVersions(versions ?? [])
      } else {
        setAvailableVersions([])
      }
    } finally {
      setLoadingVersions(false)
    }

    setStep(1)
  }

  /* ── Step 2 submit ──────────────────────────────────────────── */
  function onStep2Submit(values: Step2Values) {
    setStep2Data(values)
    setStep(2)
  }

  /* ── Step 3 submit ──────────────────────────────────────────── */
  function onStep3Submit(values: Step3Values) {
    setStep3Data(values)
    setStep(3)
  }

  /* ── Final submit ───────────────────────────────────────────── */
  function handleFinalSubmit() {
    if (!step1Data || !step2Data || !step3Data) return

    startTransition(async () => {
      const fd = new FormData()
      fd.append("title", step1Data.title)
      fd.append("sector_id", step1Data.sector_id)
      fd.append("form_version_id", step2Data.form_version_id)
      fd.append("reference_period", step1Data.reference_period)
      fd.append("periodicity", step1Data.periodicity)
      fd.append("opens_at", new Date(step3Data.opens_at).toISOString())
      fd.append("closes_at", new Date(step3Data.closes_at).toISOString())
      fd.append("target_mode", step3Data.target_mode)
      if (step3Data.target_mode === "specific" && step3Data.target_company_ids) {
        fd.append("target_company_ids", JSON.stringify(step3Data.target_company_ids))
      }

      const result = await createCampaign(fd)
      if (result && "error" in result) {
        toast.error(result.error)
      }
    })
  }

  const sectorCompanies = step1Data
    ? allCompanies.filter((c) => c.sector_id === step1Data.sector_id)
    : []

  const selectedVersion = step2Data
    ? availableVersions.find((v) => v.id === step2Data.form_version_id)
    : null

  const selectedSector = step1Data
    ? sectors.find((s) => s.id === step1Data.sector_id)
    : null

  return (
    <div className="space-y-6">
      <Stepper steps={STEPPER_STEPS} currentStep={step} />

      <div className="rounded-card border border-border bg-surface p-6 shadow-subtle">
        {/* Step 1 — Informations */}
        {step === 0 && (
          <form onSubmit={form1.handleSubmit(onStep1Submit)} noValidate className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground">Informations générales</h2>
            <FormInput
              control={form1.control}
              name="title"
              label="Titre de la campagne"
              required
              placeholder="Ex. Enquête conjoncturelle T1 2025"
            />
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                control={form1.control}
                name="sector_id"
                label="Secteur"
                required
                options={sectorOptions}
                placeholder="Sélectionner un secteur…"
              />
              <FormSelect
                control={form1.control}
                name="periodicity"
                label="Périodicité"
                required
                options={PERIODICITY_OPTIONS}
              />
            </div>
            <FormInput
              control={form1.control}
              name="reference_period"
              label="Période de référence"
              required
              placeholder="Ex. T1-2025, Janvier 2025"
              hint="Format libre"
            />
            <div className="flex justify-end">
              <Button type="submit">
                Suivant <ChevronRight className="size-4" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 2 — Formulaire */}
        {step === 1 && (
          <form onSubmit={form2.handleSubmit(onStep2Submit)} noValidate className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground">Formulaire à utiliser</h2>
            {loadingVersions ? (
              <p className="text-sm text-muted-foreground">Chargement des versions…</p>
            ) : availableVersions.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="Aucune version publiée"
                description="Aucune version de formulaire publiée pour ce secteur. Créez et publiez un formulaire d'abord."
                action={{
                  label: "Aller aux formulaires",
                  onClick: () => { window.location.href = "/direction/formulaires" },
                }}
                size="md"
              />
            ) : (
              <FormSelect
                control={form2.control}
                name="form_version_id"
                label="Version publiée"
                required
                options={availableVersions.map((v) => ({
                  value: v.id,
                  label: `v${v.version_number}${v.published_at ? ` — publiée le ${formatDate(v.published_at)}` : ""}`,
                }))}
                placeholder="Sélectionner une version…"
              />
            )}
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                Retour
              </Button>
              <Button type="submit" disabled={availableVersions.length === 0}>
                Suivant <ChevronRight className="size-4" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 3 — Cibles & Dates */}
        {step === 2 && (
          <form onSubmit={form3.handleSubmit(onStep3Submit)} noValidate className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground">Cibles & Fenêtre temporelle</h2>

            {/* Target mode */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">Entreprises cibles</p>
              <div className="flex gap-3">
                {["sector", "specific"].map((mode) => (
                  <label key={mode} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={mode}
                      {...form3.register("target_mode")}
                    />
                    <span className="text-sm">
                      {mode === "sector"
                        ? `Toutes les entreprises du secteur (${sectorCompanies.length})`
                        : "Sélection spécifique"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Specific company selection */}
            {form3.watch("target_mode") === "specific" && (
              <div className="max-h-48 overflow-y-auto rounded-md border border-border p-2 space-y-1">
                {sectorCompanies.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-2">
                    Aucune entreprise validée dans ce secteur.
                  </p>
                ) : (
                  sectorCompanies.map((c) => {
                    const ids = form3.watch("target_company_ids") ?? []
                    const checked = ids.includes(c.id)
                    return (
                      <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const current = form3.getValues("target_company_ids") ?? []
                            form3.setValue(
                              "target_company_ids",
                              e.target.checked
                                ? [...current, c.id]
                                : current.filter((id) => id !== c.id),
                            )
                          }}
                        />
                        <span className="text-sm flex-1 min-w-0">
                          <span className="font-medium">{c.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground font-mono">{c.nif}</span>
                        </span>
                      </label>
                    )
                  })
                )}
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                control={form3.control}
                name="opens_at"
                label="Date d'ouverture"
                required
                type="datetime-local"
              />
              <FormInput
                control={form3.control}
                name="closes_at"
                label="Date de clôture"
                required
                type="datetime-local"
              />
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button type="submit">
                Suivant <ChevronRight className="size-4" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 4 — Confirmation */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground">Récapitulatif</h2>
            <dl className="space-y-3 rounded-md border border-border bg-surface-2 p-4 text-sm">
              {[
                { label: "Titre", value: step1Data?.title },
                { label: "Secteur", value: selectedSector?.name },
                { label: "Période de référence", value: step1Data?.reference_period },
                { label: "Périodicité", value: PERIODICITY_OPTIONS.find((p) => p.value === step1Data?.periodicity)?.label },
                { label: "Formulaire", value: selectedVersion ? `v${selectedVersion.version_number}` : "—" },
                { label: "Mode de ciblage", value: step3Data?.target_mode === "sector" ? `Toutes les entreprises du secteur (${sectorCompanies.length})` : `${step3Data?.target_company_ids?.length ?? 0} entreprise(s) sélectionnée(s)` },
                { label: "Ouverture", value: step3Data?.opens_at ? formatDate(new Date(step3Data.opens_at)) : "—" },
                { label: "Clôture", value: step3Data?.closes_at ? formatDate(new Date(step3Data.closes_at)) : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-36 shrink-0 text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted-foreground">
              La campagne sera créée avec le statut <strong>Brouillon</strong>. Activez-la depuis la liste des campagnes.
            </p>
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Retour
              </Button>
              <Button onClick={handleFinalSubmit} disabled={isPending}>
                <Check className="size-4" />
                {isPending ? "Création en cours…" : "Créer la campagne"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
