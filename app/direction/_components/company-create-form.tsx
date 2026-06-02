"use client"

import * as React from "react"
import { useRef, useState, useTransition } from "react"
import { useForm, useWatch, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Building2, Hash, FileText, Layers, BarChart2, Briefcase,
  Calendar, Mail, Phone, MapPin, CheckCircle2, ShieldCheck, Info,
  User, Globe, Paperclip, FileCheck, AlertCircle, TriangleAlert,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FormInput, FormSelect, FormTextarea } from "@/components/ui/form-field"
import { createCompanyByDirection, uploadCompanyDocument } from "@/app/actions/companies"

/* ── Constants ────────────────────────────────────────────────────── */
const REGIONS_GUINEE = [
  "Conakry", "Boké", "Kindia", "Mamou", "Labé", "Faranah", "Kankan", "N'Zérékoré",
] as const

const REGION_OPTIONS = REGIONS_GUINEE.map((r) => ({ value: r, label: r }))

const SIZE_OPTIONS = [
  { value: "tpe", label: "TPE — Très petite entreprise" },
  { value: "pme", label: "PME — Petite et moyenne entreprise" },
  { value: "grande_entreprise", label: "Grande entreprise" },
]
const SIZE_LABELS: Record<string, string> = {
  tpe: "TPE", pme: "PME", grande_entreprise: "Grande entreprise",
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
  sa: "SA", sarl: "SARL", suarl: "SUARL", gie: "GIE", public: "Publique", autre: "Autre",
}

type DocType = "rccm" | "attestation_nif" | "bilan_comptable"

const DOC_DEFS: { type: DocType; label: string; subtitle: string; icon: React.ElementType }[] = [
  {
    type: "rccm",
    label: "Copie RCCM",
    subtitle: "Registre du Commerce certifié conforme",
    icon: FileText,
  },
  {
    type: "attestation_nif",
    label: "Attestation fiscale NIF",
    subtitle: "Délivrée par la Direction Nationale des Impôts",
    icon: ShieldCheck,
  },
  {
    type: "bilan_comptable",
    label: "Dernier bilan comptable",
    subtitle: "Exercice N-1, certifié par expert comptable agréé",
    icon: BarChart2,
  },
]

/* ── Zod schema ───────────────────────────────────────────────────── */
const schema = z.object({
  // Section 1
  name: z.string().min(2, "Raison sociale requise (2 car. min.)").max(200, "Nom trop long"),
  sigle: z.string().optional(),
  nif: z.string().regex(/^\d{9}$/, "NIF invalide — exactement 9 chiffres (ex: 123456789)"),
  rccm: z.string().optional().refine((v) => !v || v.length >= 5, "RCCM trop court"),
  legal_status: z.enum(["sa", "sarl", "suarl", "gie", "public", "autre"]),
  date_creation: z.string().optional(),
  // Section 2
  sector_id: z.string().uuid("Secteur requis"),
  activite_nace: z.string().optional(),
  capital_social: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), "Le capital social doit être un nombre entier positif"),
  size: z.enum(["tpe", "pme", "grande_entreprise"]),
  // Section 3
  region: z.string().optional(),
  commune: z.string().optional(),
  address: z.string().max(500, "Adresse trop longue").optional(),
  // Section 4
  nom_dg: z.string().optional(),
  responsable_dnpec: z.string().optional(),
  contact_email: z.string().email("Adresse email invalide (ex: contact@entreprise.gn)"),
  phone: z.string().regex(
    /^(\+?224|00224)?[0-9]{9}$/,
    "Numéro invalide — format +224 6XX XXX XXX (9 chiffres après l'indicatif)",
  ),
})

type FormValues = z.infer<typeof schema>

const REQUIRED_FIELDS: (keyof FormValues)[] = [
  "nif", "name", "sector_id", "size", "legal_status", "contact_email", "phone",
]
const OPTIONAL_FIELDS: (keyof FormValues)[] = [
  "rccm", "sigle", "date_creation", "activite_nace", "capital_social",
  "region", "commune", "address", "nom_dg", "responsable_dnpec",
]

/* ── Preview helpers ──────────────────────────────────────────────── */
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
      <span className="text-xs text-muted-foreground w-20 shrink-0 pt-px">{label}</span>
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

/* ── Live preview card ────────────────────────────────────────────── */
function CompanyPreviewCard({
  values,
  sectors,
}: {
  values: Partial<FormValues>
  sectors: { id: string; name: string; code?: string }[]
}) {
  const initials = values.name ? getInitials(values.name) : null
  const sector = sectors.find((s) => s.id === values.sector_id)

  const filledCount = ([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS] as (keyof FormValues)[]).filter(
    (k) => {
      const v = values[k]
      return v !== undefined && v !== null && String(v).trim() !== ""
    },
  ).length
  const total = REQUIRED_FIELDS.length + OPTIONAL_FIELDS.length
  const progress = Math.round((filledCount / total) * 100)

  const isReadyToSubmit = REQUIRED_FIELDS.every((k) => {
    const v = values[k]
    return v !== undefined && v !== null && String(v).trim() !== ""
  })

  return (
    <div className="rounded-card border border-border bg-surface shadow-medium overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />

      {/* Identity */}
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
                  Raison sociale
                </span>
              )}
            </h3>
            {values.sigle && (
              <p className="text-xs text-muted-foreground mt-0.5">{values.sigle}</p>
            )}
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
        {sector?.code && (
          <PreviewRow icon={Hash} label="Code" value={sector.code} mono />
        )}
        <PreviewRow
          icon={BarChart2}
          label="Taille"
          value={values.size ? SIZE_LABELS[values.size] : null}
        />
        <PreviewRow
          icon={Briefcase}
          label="Forme jur."
          value={values.legal_status ? LEGAL_STATUS_LABELS[values.legal_status] : null}
        />
        <PreviewRow
          icon={Calendar}
          label="Créée le"
          value={values.date_creation || null}
          placeholder="Non renseignée"
        />
      </div>

      {/* Localisation */}
      <div className="px-5 py-4 border-b border-border space-y-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Localisation
        </p>
        <PreviewRow icon={Globe} label="Région" value={values.region || null} />
        <PreviewRow icon={MapPin} label="Adresse" value={values.address || null} />
      </div>

      {/* Contact */}
      <div className="px-5 py-4 border-b border-border space-y-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Contact
        </p>
        <PreviewRow icon={User} label="Responsable" value={values.responsable_dnpec || null} />
        <PreviewRow icon={Mail} label="Email" value={values.contact_email || null} />
        <PreviewRow icon={Phone} label="Tél." value={values.phone || null} />
      </div>

      {/* Complétion */}
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

/* ── Section header ───────────────────────────────────────────────── */
function SectionCard({
  step,
  icon: Icon,
  title,
  children,
}: {
  step: number
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-card border border-border bg-surface shadow-subtle overflow-hidden">
      <div className="border-b border-border bg-surface-2 px-5 py-3 flex items-center gap-2.5">
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
          {step}
        </span>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Icon className="size-3.5" />
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

/* ── Document row ─────────────────────────────────────────────────── */
function DocUploadRow({
  icon: Icon,
  label,
  subtitle,
  file,
  onSelect,
}: {
  icon: React.ElementType
  label: string
  subtitle: string
  file: File | null
  onSelect: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-4 py-3">
      <div className="flex size-9 items-center justify-center rounded-lg bg-surface border border-border shrink-0">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>
        {file && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-status-ok-text font-medium">
            <FileCheck className="size-3 shrink-0" />
            {file.name}
          </p>
        )}
      </div>
      <div className="shrink-0">
        {file ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => {
              onSelect(null)
              if (inputRef.current) inputRef.current.value = ""
            }}
          >
            Retirer
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7 gap-1.5"
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip className="size-3" />
            Joindre
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  )
}

/* ── Main form ────────────────────────────────────────────────────── */
interface Props {
  sectors: { id: string; name: string; code?: string }[]
}

export function CompanyCreateForm({ sectors }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [docFiles, setDocFiles] = useState<Record<DocType, File | null>>({
    rccm: null,
    attestation_nif: null,
    bilan_comptable: null,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nif: "",
      rccm: "",
      name: "",
      sigle: "",
      legal_status: "sarl",
      date_creation: "",
      sector_id: "",
      activite_nace: "",
      capital_social: "",
      size: "pme",
      region: "Conakry",
      commune: "",
      address: "",
      nom_dg: "",
      responsable_dnpec: "",
      contact_email: "",
      phone: "",
    },
    mode: "onChange",
  })

  const watchedValues = useWatch({ control: form.control }) as Partial<FormValues>
  const watchedSectorId = watchedValues.sector_id
  const sectorCode = sectors.find((s) => s.id === watchedSectorId)?.code ?? ""
  const sectorOptions = sectors.map((s) => ({ value: s.id, label: s.name }))

  // Ordre d'affichage des champs pour le focus sur premier erreur
  const FIELD_ORDER: (keyof FormValues)[] = [
    "name", "sigle", "nif", "rccm", "legal_status", "date_creation",
    "sector_id", "activite_nace", "capital_social", "size",
    "region", "commune", "address",
    "nom_dg", "responsable_dnpec", "contact_email", "phone",
  ]

  function handleValidationError(errors: FieldErrors<FormValues>) {
    const errorCount = Object.keys(errors).length
    toast.error(
      `${errorCount} champ${errorCount > 1 ? "s" : ""} invalide${errorCount > 1 ? "s" : ""} — veuillez corriger les erreurs ci-dessus.`,
      { icon: <TriangleAlert className="size-4" /> },
    )
    const firstField = FIELD_ORDER.find((f) => errors[f])
    if (firstField) form.setFocus(firstField)
  }

  function setDocFile(type: DocType, file: File | null) {
    setDocFiles((prev) => ({ ...prev, [type]: file }))
  }

  function onReset() {
    form.reset()
    setDocFiles({ rccm: null, attestation_nif: null, bilan_comptable: null })
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append("name", values.name)
        if (values.sigle) fd.append("sigle", values.sigle)
        fd.append("nif", values.nif)
        if (values.rccm) fd.append("rccm", values.rccm)
        fd.append("legal_status", values.legal_status)
        if (values.date_creation) fd.append("date_creation", values.date_creation)
        fd.append("sector_id", values.sector_id)
        if (values.activite_nace) fd.append("activite_nace", values.activite_nace)
        if (values.capital_social && values.capital_social.trim() !== "")
          fd.append("capital_social", values.capital_social)
        fd.append("size", values.size)
        if (values.region) fd.append("region", values.region)
        if (values.commune) fd.append("commune", values.commune)
        if (values.address) fd.append("address", values.address)
        if (values.nom_dg) fd.append("nom_dg", values.nom_dg)
        if (values.responsable_dnpec) fd.append("responsable_dnpec", values.responsable_dnpec)
        fd.append("contact_email", values.contact_email)
        fd.append("phone", values.phone)

        const result = await createCompanyByDirection(fd)
        if ("error" in result) {
          toast.error(result.error)
          return
        }

        const { company_id } = result

        // Upload des pièces justificatives après création
        const uploadEntries = (Object.entries(docFiles) as [DocType, File | null][]).filter(
          ([, file]) => file !== null,
        ) as [DocType, File][]

        for (const [docType, file] of uploadEntries) {
          const docFd = new FormData()
          docFd.append("file", file)
          const uploadResult = await uploadCompanyDocument(company_id, docType, docFd)
          if ("error" in uploadResult) {
            toast.warning(`Pièce "${docType}" non uploadée : ${uploadResult.error}`)
          }
        }

        toast.success("Entreprise enregistrée avec succès.")
        router.push("/direction/entreprises")
      } catch {
        toast.error("Une erreur inattendue s'est produite. Veuillez réessayer.")
      }
    })
  }

  return (
    <div className="flex gap-6 items-start">
      {/* ── Colonne gauche — Formulaire ──────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Bandeau info */}
        <div className="flex items-start gap-2 rounded-lg border border-status-info/30 bg-status-info-bg px-3.5 py-3 text-sm text-status-info-text">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            L&apos;entreprise sera créée avec le statut{" "}
            <strong>Validée</strong> immédiatement, sans compte utilisateur associé.
          </span>
        </div>

        {/* ── Section 1 — Identité légale ──────────────────────── */}
        <SectionCard step={1} icon={Building2} title="Identité légale">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <FormInput
              control={form.control}
              name="name"
              label="Raison sociale"
              required
              className="col-span-2"
              placeholder="Ex. : Hydro Guinée SARL"
            />
            <FormInput
              control={form.control}
              name="sigle"
              label="Sigle / Abréviation"
              placeholder="Ex. : HGS"
            />
            <FormInput
              control={form.control}
              name="nif"
              label="NIF"
              required
              placeholder="123456789"
              hint="Format : 9 chiffres"
              maxLength={9}
            />
            <FormInput
              control={form.control}
              name="rccm"
              label="RCCM"
              placeholder="RCCM/GN/CON/2024/B/00123"
              hint="Ex: RCCM/GN/CON/2024/B/00123"
            />
            <FormSelect
              control={form.control}
              name="legal_status"
              label="Forme juridique"
              required
              options={LEGAL_STATUS_OPTIONS}
              placeholder="Sélectionner…"
            />
            <FormInput
              control={form.control}
              name="date_creation"
              label="Date de création"
              type="date"
            />
          </div>
        </SectionCard>

        {/* ── Section 2 — Classification sectorielle ───────────── */}
        <SectionCard step={2} icon={Layers} title="Classification sectorielle">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <FormSelect
              control={form.control}
              name="sector_id"
              label="Secteur DNPEC"
              required
              options={sectorOptions}
              placeholder="Sélectionner un secteur…"
            />
            {/* Code sectoriel — lecture seule, auto-rempli */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">
                Code sectoriel DNPEC
              </label>
              <div className="h-9 rounded-md border border-border bg-surface-2 px-3 flex items-center">
                <span className={cn(
                  "text-sm font-mono",
                  sectorCode ? "text-foreground" : "text-muted-foreground/50 italic text-xs",
                )}>
                  {sectorCode || "Auto-rempli selon le secteur"}
                </span>
              </div>
            </div>
            <FormInput
              control={form.control}
              name="activite_nace"
              label="Activité principale NACE"
              placeholder="Ex: B0710 — Extraction minéraux de fer"
            />
            <FormInput
              control={form.control}
              name="capital_social"
              label="Capital social (GNF)"
              type="number"
              placeholder="0"
              hint="En francs guinéens"
            />
            <FormSelect
              control={form.control}
              name="size"
              label="Taille de l'entreprise"
              required
              options={SIZE_OPTIONS}
              className="col-span-2"
            />
          </div>
        </SectionCard>

        {/* ── Section 3 — Localisation ─────────────────────────── */}
        <SectionCard step={3} icon={MapPin} title="Localisation">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <FormSelect
              control={form.control}
              name="region"
              label="Région"
              options={REGION_OPTIONS}
              placeholder="Sélectionner une région…"
            />
            <FormInput
              control={form.control}
              name="commune"
              label="Commune / Préfecture"
              placeholder="Ex. : Commune de Kaloum"
            />
            <FormTextarea
              control={form.control}
              name="address"
              label="Adresse siège social"
              className="col-span-2"
              rows={2}
              placeholder="Ex. : Conakry, Commune de Kaloum, BP 123"
            />
          </div>
        </SectionCard>

        {/* ── Section 4 — Contact & Responsable déclarant ──────── */}
        <SectionCard step={4} icon={User} title="Contact & Responsable déclarant">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <FormInput
              control={form.control}
              name="nom_dg"
              label="Nom du Directeur Général"
              placeholder="Ex. : Mamadou Diallo"
            />
            <FormInput
              control={form.control}
              name="responsable_dnpec"
              label="Responsable déclarations DNPEC"
              placeholder="Ex. : Fatoumata Camara"
            />
            <FormInput
              control={form.control}
              name="contact_email"
              label="Email responsable"
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
              hint="+224 6XX XX XX XX"
            />
          </div>
        </SectionCard>

        {/* ── Section 5 — Pièces justificatives ───────────────── */}
        <SectionCard step={5} icon={FileText} title="Pièces justificatives">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-1">
              Formats acceptés : PDF, JPG, PNG — 10 Mo max par fichier.
              Les fichiers seront enregistrés après création de l&apos;entreprise.
            </p>
            {DOC_DEFS.map((doc) => (
              <DocUploadRow
                key={doc.type}
                icon={doc.icon}
                label={doc.label}
                subtitle={doc.subtitle}
                file={docFiles[doc.type]}
                onSelect={(file) => setDocFile(doc.type, file)}
              />
            ))}
          </div>
        </SectionCard>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div className="rounded-card border border-border bg-surface shadow-subtle p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
              L&apos;entreprise recevra ses identifiants de connexion au portail par email.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                disabled={isPending}
              >
                Réinitialiser
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit, handleValidationError)}
                disabled={isPending}
                className="min-w-44"
              >
                {isPending ? "Enregistrement…" : "Enregistrer l'entreprise"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Colonne droite — Aperçu ──────────────────────────────── */}
      <div className="w-80 shrink-0 sticky top-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Aperçu en temps réel
        </p>
        <CompanyPreviewCard values={watchedValues} sectors={sectors} />
      </div>
    </div>
  )
}
