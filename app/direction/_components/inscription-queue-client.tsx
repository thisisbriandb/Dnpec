"use client"

import * as React from "react"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Inbox, CheckCircle, XCircle } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
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
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"

export type InscriptionCompany = {
  id: string
  nif: string
  rccm: string | null
  name: string
  contact_email: string
  phone: string
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
  const [data, setData] = React.useState<Company[]>(pending)

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

  const columns: ColumnDef<Company>[] = [
    {
      accessorKey: "nif",
      header: "NIF",
      cell: ({ row }) => (
        <span className="text-mono font-mono text-sm">{formatNIF(row.original.nif)}</span>
      ),
      size: 120,
    },
    {
      accessorKey: "name",
      header: "Entreprise",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.contact_email}</p>
        </div>
      ),
    },
    {
      id: "sector",
      header: "Secteur",
      cell: ({ row }) => row.original.sector?.name ?? "—",
      size: 120,
    },
    {
      id: "size",
      header: "Taille",
      cell: ({ row }) => {
        const labels: Record<string, string> = {
          tpe: "TPE",
          pme: "PME",
          grande_entreprise: "Grande entreprise",
        }
        return labels[row.original.size] ?? row.original.size
      },
      size: 120,
    },
    {
      id: "focal",
      header: "Point focal",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate">{row.original.profile?.full_name ?? "—"}</p>
          <p className="text-xs text-muted-foreground truncate">{row.original.profile?.email ?? ""}</p>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date demande",
      cell: ({ row }) => (
        <div>
          <p>{formatDate(row.original.created_at)}</p>
          <p className="text-xs text-muted-foreground">{formatRelative(row.original.created_at)}</p>
        </div>
      ),
      size: 140,
    },
    {
      id: "actions",
      header: "",
      size: 120,
      cell: ({ row }) => {
        const id = row.original.id
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleValidate(id)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-7 gap-1.5 text-status-ok-text hover:bg-status-ok-bg hover:text-status-ok-text"
              )}
            >
              <CheckCircle className="size-3.5" />
              Valider
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRejectOpen(id)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-7 gap-1.5 text-status-bad-text hover:bg-status-bad-bg hover:text-status-bad-text"
              )}
            >
              <XCircle className="size-3.5" />
              Rejeter
            </button>
          </div>
        )
      },
    },
  ]

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

      <DataTable
        data={data}
        columns={columns}
        emptyState={{
          icon: Inbox,
          title: "Aucune inscription en attente",
          description: "Toutes les demandes ont été traitées.",
        }}
      />

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
