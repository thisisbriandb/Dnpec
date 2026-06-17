"use client"

import * as React from "react"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Inbox, CheckCircle, XCircle } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { FormTextarea } from "@/components/ui/form-field"
import { validateCompany, rejectCompany } from "@/app/actions/companies"
import { formatNIF, formatDate, formatRelative } from "@/lib/format"
import { CompanyTags } from "@/app/direction/_components/company-tags"
import { MissingFieldAlert } from "@/app/direction/_components/missing-field-alert"

export type InscriptionCompany = {
  id: string
  nif: string
  rccm: string | null
  name: string
  contact_email: string
  phone: string
  address: string | null
  creation_year: number | null
  size: string
  legal_status: string
  created_at: string
  sector: { name: string } | null
  profile: { full_name: string; email: string; created_at: string } | null
}

const rejectFormSchema = z.object({
  rejection_reason: z
    .string()
    .min(10, "Le motif doit contenir au moins 10 caractères.")
    .max(500, "Maximum 500 caractères."),
})

type RejectFormValues = z.infer<typeof rejectFormSchema>

type Company = InscriptionCompany

interface InscriptionQueueProps {
  pending: InscriptionCompany[]
  onItemRemoved?: () => void
}

export function InscriptionQueueClient({ pending, onItemRemoved }: InscriptionQueueProps) {
  const [isPending, startTransition] = useTransition()
  const [rejectingId, setRejectingId] = React.useState<string | null>(null)
  const [validatingId, setValidatingId] = React.useState<string | null>(null)
  const [data, setData] = React.useState<Company[]>(pending)
  const validatingCompany = data.find((c) => c.id === validatingId) ?? null

  const rejectForm = useForm<RejectFormValues>({
    resolver: zodResolver(rejectFormSchema),
    defaultValues: { rejection_reason: "" },
  })

  function handleValidate(id: string) {
    startTransition(async () => {
      const result = await validateCompany(id)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("Entreprise validée avec succès.")
        setData((prev) => prev.filter((c) => c.id !== id))
        onItemRemoved?.()
      }
    })
  }

  function handleValidateConfirm() {
    if (!validatingId) return
    const id = validatingId
    setValidatingId(null)
    handleValidate(id)
  }

  function handleRejectOpen(id: string) {
    rejectForm.reset({ rejection_reason: "" })
    setRejectingId(id)
  }

  function handleRejectSubmit(values: RejectFormValues) {
    if (!rejectingId) return
    const id = rejectingId
    startTransition(async () => {
      const fd = new FormData()
      fd.append("company_id", id)
      fd.append("rejection_reason", values.rejection_reason)
      const result = await rejectCompany(fd)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("Inscription rejetée.")
        setData((prev) => prev.filter((c) => c.id !== id))
        setRejectingId(null)
        onItemRemoved?.()
      }
    })
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aucune inscription en attente"
        description="Toutes les demandes d'inscription ont été traitées."
        size="lg"
      />
    )
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <StatusBadge status="pending" size="md" />
        <span className="text-sm text-muted-foreground">
          {data.length} demande{data.length > 1 ? "s" : ""} en attente
        </span>
      </div>

      <div className="space-y-3">
        {data.map((company) => (
          <div
            key={company.id}
            className="rounded-card border border-border bg-surface p-5 shadow-subtle"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{company.name}</h3>
                <div className="mt-1.5">
                  <CompanyTags
                    size={company.size}
                    legalStatus={company.legal_status}
                    sectorName={company.sector?.name}
                  />
                </div>
              </div>
              <div className="flex flex-col items-stretch gap-1.5 shrink-0">
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => setValidatingId(company.id)}
                  className="gap-1.5 bg-status-ok text-white hover:bg-status-ok/90"
                >
                  <CheckCircle className="size-3.5" />
                  Valider
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => handleRejectOpen(company.id)}
                  className="gap-1.5 text-status-bad-text hover:bg-status-bad-bg hover:text-status-bad-text"
                >
                  <XCircle className="size-3.5" />
                  Rejeter…
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <p className="text-sm">
                <span className="text-muted-foreground">NIF : </span>
                <span className="font-mono">{formatNIF(company.nif)}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">RCCM : </span>
                {company.rccm ? (
                  <span className="font-medium">{company.rccm}</span>
                ) : (
                  <span className="text-status-warn-text">Manquant</span>
                )}
              </p>
              <p className="text-sm truncate">
                <span className="text-muted-foreground">Email : </span>
                <span className="font-medium">{company.contact_email}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Téléphone : </span>
                <span className="font-medium">{company.phone}</span>
              </p>
              <p className="text-sm truncate">
                <span className="text-muted-foreground">Adresse : </span>
                <span className="font-medium">{company.address ?? "—"}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Fondée en : </span>
                <span className="font-medium">{company.creation_year ?? "—"}</span>
              </p>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Soumis le {formatDate(company.created_at)} · {formatRelative(company.created_at)}
            </p>

            {!company.rccm && (
              <div className="mt-3">
                <MissingFieldAlert message="RCCM manquant — vérifier auprès du greffe" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Validate Confirmation Dialog */}
      <Dialog open={validatingId !== null} onOpenChange={(open) => { if (!open) setValidatingId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider l&apos;inscription</DialogTitle>
            <DialogDescription>
              {validatingCompany
                ? `Confirmez-vous la validation de l'inscription de « ${validatingCompany.name} » ? L'entreprise sera notifiée et pourra accéder à la plateforme.`
                : "Confirmez-vous la validation de cette inscription ?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setValidatingId(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={handleValidateConfirm}
              className="bg-status-ok text-white hover:bg-status-ok/90"
            >
              Confirmer la validation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectingId !== null} onOpenChange={(open) => { if (!open) setRejectingId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l&apos;inscription</DialogTitle>
            <DialogDescription>
              Indiquez le motif du rejet. L&apos;entreprise sera notifiée.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={rejectForm.handleSubmit(handleRejectSubmit)}>
            <FormTextarea
              control={rejectForm.control}
              name="rejection_reason"
              label="Motif du rejet"
              required
              hint="Minimum 10 caractères"
              rows={4}
            />
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectingId(null)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isPending}
              >
                Confirmer le rejet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
