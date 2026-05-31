"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { CheckCircle, XCircle, PauseCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { validateCompany, rejectCompany, suspendCompany } from "@/app/actions/companies"
import * as React from "react"

const rejectSchema = z.object({
  rejection_reason: z.string().min(10, "Motif requis (10 car. min.)").max(500),
})
type RejectValues = z.infer<typeof rejectSchema>

interface Props {
  companyId: string
  currentStatus: string
}

export function CompanyActionBar({ companyId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition()
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [status, setStatus] = React.useState(currentStatus)

  const form = useForm<RejectValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { rejection_reason: "" },
  })

  function handleValidate() {
    startTransition(async () => {
      const result = await validateCompany(companyId)
      if ("error" in result) toast.error(result.error)
      else { toast.success("Entreprise validée."); setStatus("validated") }
    })
  }

  function handleSuspend() {
    startTransition(async () => {
      const result = await suspendCompany(companyId)
      if ("error" in result) toast.error(result.error)
      else { toast.success("Entreprise suspendue."); setStatus("suspended") }
    })
  }

  function handleRejectSubmit(values: RejectValues) {
    startTransition(async () => {
      const fd = new FormData()
      fd.append("company_id", companyId)
      fd.append("rejection_reason", values.rejection_reason)
      const result = await rejectCompany(fd)
      if ("error" in result) toast.error(result.error)
      else {
        toast.success("Entreprise rejetée.")
        setStatus("rejected")
        setRejectOpen(false)
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        {(status === "pending" || status === "suspended") && (
          <Button
            size="sm"
            onClick={handleValidate}
            disabled={isPending}
            className="gap-1.5 bg-status-ok text-white hover:bg-status-ok/90"
          >
            <CheckCircle className="size-3.5" />
            {status === "suspended" ? "Réactiver" : "Valider"}
          </Button>
        )}

        {status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => { form.reset(); setRejectOpen(true) }}
            className="gap-1.5 border-status-bad/40 text-status-bad-text hover:bg-status-bad-bg"
          >
            <XCircle className="size-3.5" />
            Rejeter
          </Button>
        )}

        {status === "validated" && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={handleSuspend}
            className="gap-1.5"
          >
            <PauseCircle className="size-3.5" />
            Suspendre
          </Button>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l&apos;inscription</DialogTitle>
            <DialogDescription>
              Indiquez le motif du rejet. L&apos;entreprise sera notifiée.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleRejectSubmit)}>
            <FormTextarea
              control={form.control}
              name="rejection_reason"
              label="Motif"
              required
              rows={4}
            />
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                Confirmer le rejet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
