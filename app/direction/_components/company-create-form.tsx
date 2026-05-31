"use client"

import * as React from "react"
import { useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Building2, Hash, FileText, Layers, BarChart2, Briefcase,
  Calendar, Mail, Phone, MapPin, CheckCircle2, ShieldCheck, Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FormInput, FormSelect, FormTextarea } from "@/components/ui/form-field"
import { createCompanyByDirection } from "@/app/actions/companies"

/* ── Validation ───────────────────────────────────────────────── */
const CURRENT_YEAR = new Date().getFullYear()

const schema = z.object({
  nif: z
    .string()
    .regex(/^\d{9}$/, "NIF invalide — exactement 9 chiffres (ex: 123456789)"),
  rccm: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 5, "RCCM trop court"),
  name: z
    .string()
    .min(2, "Nom requis (2 car. min.)")
    .max(200, "Nom trop long"),
  sector_id: z.string().uuid("Secteur requis"),
  size: z.enum(["tpe", "pme", "grande_entreprise"]),
  legal_status: z.enum(["sa", "sarl", "suarl", "gie", "public", "autre"]),
  contact_email: z
    .string()
    .email("Adresse email invalide (ex: contact@entreprise.gn)"),
  phone: z
    .string()
    .regex(
      /^(\+?224|00224)?[0-9]{9}$/,
      "Numéro invalide — format +224 6XX XXX XXX (9 chiffres après l'indicatif)",
    ),
  address: z.string().max(500, "Adresse trop longue").optional(),
  creation_year: z
    .string()
    .optional()
    .refine(
      (v) =>
        !v ||
        (/^\d{4}$/.test(v) &&
          parseInt(v) >= 1900 &&
          parseInt(v) <= CURRENT_YEAR),
      { message: `Année entre 1900 et ${CURRENT_YEAR}` },
    ),
})

type FormValues = z.infer<typeof schema>

/* ── Display labels ───────────────────────────────────────────── */
const SIZE_OPTIONS = [
  { value: "tpe", label: "TPE — Très petite entreprise" },
  { value: "pme", label: "PME — Petite et moyenne entreprise" },
  { value: "grande_entreprise", label: "Grande entreprise" },
]
const SIZE_LABELS: Record<string, string> = {
  tpe: "TPE",
  pme: "PME",
  grande_entreprise: "Grande entreprise",
}

const LEGAL_STATUS_OPTIONS = [
  { value: "sa", label: "SA — Société anonyme" },
  { value: "sarl", label: "SARL — Société à responsabilité limitée" },
  { value: "suarl", label: "SUARL — Société unipersonnelle à responsabilité limitée" },
  { value: "gie", label: "GIE — Groupement d'intérêt économique" },
  { value: "public", label: "Entreprise publique" },
  { value: "autre", label: "Autre" },
]
const LEGAL_STATUS_LABELS: Record<string, string> = {
  sa: "SA",
  sarl: "SARL",
  suarl: "SUARL",
  gie: "GIE",
  public: "Publique",
  autre: "Autre",
}

/* ── Preview helpers ──────────────────────────────────────────── */
function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function PreviewRow({
  icon: Icon,
  label,
  value,
  mono,
  placeholder = "—",
}: {
  icon: React.ElementType
  label: string
  value?: string | null
  mono?: boolean
  placeholder?: string
}) {
  const empty = !value
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <Icon className="mt-0.5 size-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground w-16 shrink-0 pt-px">{label}</span>
      <span
        className={cn(
          "text-xs flex-1 min-w-0 break-words",
          mono && "font-mono",
          empty ? "text-muted-foreground/50 italic" : "text-foreground font-medium",
        )}
      >
        {value || placeholder}
      </span>
    </div>
  )
}

/* ── Live preview card ────────────────────────────────────────── */
function CompanyPreviewCard({
  values,
  sectors,
}: {
  values: FormValues
  sectors: { id: string; name: string }[]
}) {
  const initials = values.name ? getInitials(values.name) : null
  const sector = sectors.find((s) => s.id === values.sector_id)

  const REQUIRED_FIELDS: (keyof FormValues)[] = [
    "nif", "name", "sector_id", "size", "legal_status", "contact_email", "phone",
  ]
  const OPTIONAL_FIELDS: (keyof FormValues)[] = ["rccm", "address", "creation_year"]
  const filledCount =
    [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].filter((k) => {
      const v = values[k]
      return v && String(v).trim() !== ""
    }).length
  const total = REQUIRED_FIELDS.length + OPTIONAL_FIELDS.length
  const progress = Math.round((filledCount / total) * 100)

  const isReadyToSubmit = REQUIRED_FIELDS.every((k) => {
    const v = values[k]
    return v && String(v).trim() !== ""
  })

  return (
    <div className="rounded-card border border-border bg-surface shadow-medium overflow-hidden">
      {/* Accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />

      {/* Identity header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-xl text-lg font-bold shrink-0 transition-all",
              initials
                ? "bg-primary text-primary-foreground"
                : "bg-surface-2 text-muted-foreground border border-dashed border-border-strong",
            )}
          >
            {initials ?? <Building2 className="size-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground text-sm leading-tight min-h-[1.25rem]">
              {values.name || (
                <span className="italic text-muted-foreground/60 font-normal">
                  Nom de l&apos;entreprise
                </span>
              )}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-status-ok-bg px-2 py-0.5 text-[10px] font-semibold text-status-ok-text">
                <CheckCircle2 className="size-2.5" />
                Validée
              </span>
              {values.legal_status && (
                <span className="rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {LEGAL_STATUS_LABELS[values.legal_status]}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Identifiants */}
      <div className="px-5 py-4 border-b border-border space-y-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Identifiants
        </p>
        <PreviewRow icon={Hash} label="NIF" value={values.nif} mono placeholder="000000000" />
        <PreviewRow icon={FileText} label="RCCM" value={values.rccm || null} mono />
      </div>

      {/* Classification */}
      <div className="px-5 py-4 border-b border-border space-y-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Classification
        </p>
        <PreviewRow icon={Layers} label="Secteur" value={sector?.name} />
        <PreviewRow icon={BarChart2} label="Taille" value={values.size ? SIZE_LABELS[values.size] : null} />
        <PreviewRow icon={Briefcase} label="Forme jur." value={values.legal_status ? LEGAL_STATUS_LABELS[values.legal_status] : null} />
        <PreviewRow icon={Calendar} label="Fondée en" value={values.creation_year || null} placeholder="Non renseignée" />
      </div>

      {/* Contact */}
      <div className="px-5 py-4 border-b border-border space-y-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Contact
        </p>
        <PreviewRow icon={Mail} label="Email" value={values.contact_email || null} />
        <PreviewRow icon={Phone} label="Tél." value={values.phone || null} />
        <PreviewRow icon={MapPin} label="Adresse" value={values.address || null} />
      </div>

      {/* Completion */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Complétion</span>
          <span className="font-mono font-semibold text-foreground">{progress} %</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progress === 100 ? "bg-status-ok" : "bg-primary",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {filledCount} / {total} champs renseignés
        </p>

        {isReadyToSubmit && (
          <div className="mt-3 flex items-center gap-1.5 rounded-md bg-status-ok-bg border border-status-ok/20 px-2.5 py-2 text-[11px] font-medium text-status-ok-text">
            <ShieldCheck className="size-3.5" />
            Prêt à enregistrer
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main form ────────────────────────────────────────────────── */
interface Props {
  sectors: { id: string; name: string }[]
}

export function CompanyCreateForm({ sectors }: Props) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nif: "",
      rccm: "",
      name: "",
      sector_id: "",
      size: "pme",
      legal_status: "sarl",
      contact_email: "",
      phone: "",
      address: "",
      creation_year: "",
    },
    mode: "onChange",
  })

  const watchedValues = useWatch({ control: form.control }) as FormValues

  const sectorOptions = sectors.map((s) => ({ value: s.id, label: s.name }))

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const fd = new FormData()
      fd.append("nif", values.nif)
      if (values.rccm) fd.append("rccm", values.rccm)
      fd.append("name", values.name)
      fd.append("sector_id", values.sector_id)
      fd.append("size", values.size)
      fd.append("legal_status", values.legal_status)
      fd.append("contact_email", values.contact_email)
      fd.append("phone", values.phone)
      if (values.address) fd.append("address", values.address)
      if (values.creation_year && values.creation_year.trim() !== "")
        fd.append("creation_year", values.creation_year)

      const result = await createCompanyByDirection(fd)
      if (result && "error" in result) {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex gap-6 items-start">
      {/* ── Left column — Form ───────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-2 rounded-lg border border-status-info/30 bg-status-info-bg px-3.5 py-3 text-sm text-status-info-text">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            L&apos;entreprise sera créée avec le statut{" "}
            <strong>Validée</strong> immédiatement, sans compte utilisateur associé.
          </span>
        </div>

        {/* Section — Identité */}
        <div className="rounded-card border border-border bg-surface shadow-subtle overflow-hidden">
          <div className="border-b border-border bg-surface-2 px-5 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Identité légale
            </h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-x-4 gap-y-5">
            <FormInput
              control={form.control}
              name="nif"
              label="NIF"
              required
              placeholder="123456789"
              hint="9 chiffres sans espaces"
              maxLength={9}
            />
            <FormInput
              control={form.control}
              name="rccm"
              label="RCCM"
              placeholder="GN-KA-2020-B-12345"
              hint="Optionnel"
            />
            <FormInput
              control={form.control}
              name="name"
              label="Raison sociale"
              required
              className="col-span-2"
              placeholder="Ex. : Hydro Guinée SARL"
            />
          </div>
        </div>

        {/* Section — Classification */}
        <div className="rounded-card border border-border bg-surface shadow-subtle overflow-hidden">
          <div className="border-b border-border bg-surface-2 px-5 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Classification
            </h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-x-4 gap-y-5">
            <FormSelect
              control={form.control}
              name="sector_id"
              label="Secteur d'activité"
              required
              options={sectorOptions}
              placeholder="Sélectionner un secteur…"
              className="col-span-2"
            />
            <FormSelect
              control={form.control}
              name="size"
              label="Taille de l'entreprise"
              required
              options={SIZE_OPTIONS}
            />
            <FormSelect
              control={form.control}
              name="legal_status"
              label="Forme juridique"
              required
              options={LEGAL_STATUS_OPTIONS}
            />
            <FormInput
              control={form.control}
              name="creation_year"
              label="Année de création"
              type="number"
              placeholder={`${CURRENT_YEAR}`}
              hint={`Entre 1900 et ${CURRENT_YEAR}`}
            />
          </div>
        </div>

        {/* Section — Contact */}
        <div className="rounded-card border border-border bg-surface shadow-subtle overflow-hidden">
          <div className="border-b border-border bg-surface-2 px-5 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Coordonnées
            </h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-x-4 gap-y-5">
            <FormInput
              control={form.control}
              name="contact_email"
              label="Email de contact"
              required
              type="email"
              placeholder="contact@entreprise.gn"
            />
            <FormInput
              control={form.control}
              name="phone"
              label="Téléphone"
              required
              placeholder="+224 622 000 000"
              hint="Indicatif +224 suivi de 9 chiffres"
            />
            <FormTextarea
              control={form.control}
              name="address"
              label="Adresse"
              className="col-span-2"
              rows={2}
              placeholder="Ex. : Conakry, Commune de Kaloum, BP 123"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => history.back()}
          >
            Annuler
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isPending}
            className="min-w-36"
          >
            {isPending ? "Création en cours…" : "Enregistrer l'entreprise"}
          </Button>
        </div>
      </div>

      {/* ── Right column — Live preview ──────────────────────────── */}
      <div className="w-80 shrink-0 sticky top-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Aperçu en temps réel
        </p>
        <CompanyPreviewCard values={watchedValues} sectors={sectors} />
      </div>
    </div>
  )
}
