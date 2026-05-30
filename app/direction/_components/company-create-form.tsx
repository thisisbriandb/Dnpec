"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormInput, FormSelect, FormTextarea } from "@/components/ui/form-field"
import { createCompanyByDirection } from "@/app/actions/companies"

const schema = z.object({
  nif: z.string().min(3, "NIF requis"),
  rccm: z.string().optional(),
  name: z.string().min(2, "Nom requis"),
  sector_id: z.string().uuid("Secteur requis"),
  size: z.enum(["tpe", "pme", "grande_entreprise"]),
  legal_status: z.enum(["sa", "sarl", "suarl", "gie", "public", "autre"]),
  contact_email: z.string().email("Email invalide"),
  phone: z.string().min(6, "Téléphone requis"),
  address: z.string().optional(),
  creation_year: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const SIZE_OPTIONS = [
  { value: "tpe", label: "TPE — Très petite entreprise" },
  { value: "pme", label: "PME — Petite et moyenne entreprise" },
  { value: "grande_entreprise", label: "Grande entreprise" },
]

const LEGAL_STATUS_OPTIONS = [
  { value: "sa", label: "SA — Société anonyme" },
  { value: "sarl", label: "SARL — Société à responsabilité limitée" },
  { value: "suarl", label: "SUARL — Société unipersonnelle à responsabilité limitée" },
  { value: "gie", label: "GIE — Groupement d'intérêt économique" },
  { value: "public", label: "Entreprise publique" },
  { value: "autre", label: "Autre" },
]

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
      creation_year: undefined,
    },
  })

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
      if (values.creation_year && values.creation_year.trim() !== "") {
        fd.append("creation_year", values.creation_year)
      }

      const result = await createCompanyByDirection(fd)
      if (result && "error" in result) {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-subtle">
      <div className="mb-5 flex items-start gap-2 rounded-md border border-status-info/30 bg-status-info-bg px-3 py-2.5 text-sm text-status-info-text">
        <InfoIcon className="mt-0.5 size-4 shrink-0" />
        <span>
          L&apos;entreprise sera créée avec le statut <strong>Validée</strong> immédiatement. Aucun compte utilisateur n&apos;est associé à cette création.
        </span>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          {/* NIF */}
          <FormInput
            control={form.control}
            name="nif"
            label="NIF"
            required
            placeholder="000000000"
          />

          {/* RCCM */}
          <FormInput
            control={form.control}
            name="rccm"
            label="RCCM"
            placeholder="GN-KA-…"
          />

          {/* Nom */}
          <FormInput
            control={form.control}
            name="name"
            label="Nom de l'entreprise"
            required
            className="col-span-2"
            placeholder="Ex. : Hydro Guinée SARL"
          />

          {/* Email */}
          <FormInput
            control={form.control}
            name="contact_email"
            label="Email de contact"
            required
            type="email"
            placeholder="contact@entreprise.gn"
          />

          {/* Téléphone */}
          <FormInput
            control={form.control}
            name="phone"
            label="Téléphone"
            required
            placeholder="+224 6XX XXX XXX"
          />

          {/* Secteur */}
          <FormSelect
            control={form.control}
            name="sector_id"
            label="Secteur"
            required
            options={sectorOptions}
            placeholder="Sélectionner un secteur…"
          />

          {/* Taille */}
          <FormSelect
            control={form.control}
            name="size"
            label="Taille"
            required
            options={SIZE_OPTIONS}
          />

          {/* Statut juridique */}
          <FormSelect
            control={form.control}
            name="legal_status"
            label="Statut juridique"
            required
            options={LEGAL_STATUS_OPTIONS}
          />

          {/* Année de création */}
          <FormInput
            control={form.control}
            name="creation_year"
            label="Année de création"
            type="number"
            placeholder="2010"
          />

          {/* Adresse */}
          <FormTextarea
            control={form.control}
            name="address"
            label="Adresse"
            className="col-span-2"
            rows={3}
            placeholder="Conakry, Kaloum…"
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => history.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Création en cours…" : "Créer l'entreprise"}
          </Button>
        </div>
      </form>
    </div>
  )
}
