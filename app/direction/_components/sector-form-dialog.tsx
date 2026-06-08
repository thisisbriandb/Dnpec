"use client"

import * as React from "react"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FormInput, FormTextarea } from "@/components/ui/form-field"
import { createSector, updateSector } from "@/app/actions/sectors"
import type { TableSector } from "./sectors-table-client"

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Code requis (2 car. min.)")
    .max(20, "Code trop long (20 car. max.)")
    .regex(/^[A-Za-z0-9_-]+$/, "Lettres, chiffres, tirets et underscores uniquement"),
  name: z.string().trim().min(2, "Nom requis (2 car. min.)").max(120, "Nom trop long"),
  description: z.string().max(1000, "Description trop longue").optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  sector?: TableSector | null
  onSaved: (sector: TableSector) => void
}

export function SectorFormDialog({ open, onOpenChange, sector, onSaved }: Props) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!sector

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "", name: "", description: "" },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        code: sector?.code ?? "",
        name: sector?.name ?? "",
        description: sector?.description ?? "",
      })
    }
  }, [open, sector, form])

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const fd = new FormData()
      if (sector) fd.append("id", sector.id)
      fd.append("code", values.code)
      fd.append("name", values.name)
      if (values.description) fd.append("description", values.description)

      const result = sector ? await updateSector(fd) : await createSector(fd)
      if ("error" in result) {
        toast.error(result.error)
        return
      }

      toast.success(isEdit ? "Secteur mis à jour." : "Secteur créé.")
      onOpenChange(false)
      onSaved({
        id: sector?.id ?? crypto.randomUUID(),
        code: values.code.toUpperCase(),
        name: values.name,
        description: values.description || null,
        is_active: sector?.is_active ?? true,
        company_count: sector?.company_count ?? 0,
        campaign_count: sector?.campaign_count ?? 0,
        has_form_template: sector?.has_form_template ?? false,
        created_at: sector?.created_at ?? new Date().toISOString(),
      })
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le secteur" : "Nouveau secteur"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettez à jour les informations de ce secteur économique."
              : "Créez un secteur économique DNPEC. Il sera disponible immédiatement pour les entreprises, campagnes et formulaires."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormInput
            control={form.control}
            name="code"
            label="Code secteur"
            required
            placeholder="Ex. : MINES"
            hint="Lettres et chiffres, converti en majuscules"
            maxLength={20}
          />
          <FormInput
            control={form.control}
            name="name"
            label="Nom"
            required
            placeholder="Ex. : Mines et carrières"
          />
          <FormTextarea
            control={form.control}
            name="description"
            label="Description"
            placeholder="Description du secteur (facultatif)"
            rows={3}
          />
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le secteur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
