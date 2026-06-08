"use client"

import * as React from "react"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Copy, ShieldAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FormInput, FormSelect } from "@/components/ui/form-field"
import { createDnpecUser, updateDnpecUser } from "@/app/actions/dnpec-users"
import { ROLE_LABELS } from "@/lib/status"
import type { TableDnpecUser } from "./users-table-client"

const ROLE_OPTIONS = (["super_admin", "analyste", "agent_saisie"] as const).map((r) => ({
  value: r,
  label: ROLE_LABELS[r],
}))

const baseSchema = {
  full_name: z.string().trim().min(2, "Nom requis (2 car. min.)").max(150, "Nom trop long"),
  role: z.enum(["super_admin", "analyste", "agent_saisie"], { message: "Rôle requis" }),
  phone: z.string().optional(),
  division: z.string().optional(),
}

const createSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  ...baseSchema,
})

const editSchema = z.object(baseSchema)

type CreateValues = z.infer<typeof createSchema>
type EditValues = z.infer<typeof editSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: TableDnpecUser | null
  onSaved: (user: TableDnpecUser) => void
  onCreatedTemporaryPassword: (email: string, password: string) => void
}

export function UserFormDialog({ open, onOpenChange, user, onSaved, onCreatedTemporaryPassword }: Props) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!user

  const form = useForm<CreateValues | EditValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: { email: "", full_name: "", role: "agent_saisie", phone: "", division: "" },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        email: user?.email ?? "",
        full_name: user?.full_name ?? "",
        role: user?.role ?? "agent_saisie",
        phone: user?.phone ?? "",
        division: user?.division ?? "",
      })
    }
  }, [open, user, form])

  function onSubmit(values: CreateValues | EditValues) {
    startTransition(async () => {
      const fd = new FormData()
      if (user) fd.append("id", user.id)
      else fd.append("email", (values as CreateValues).email)
      fd.append("full_name", values.full_name)
      fd.append("role", values.role)
      if (values.phone) fd.append("phone", values.phone)
      if (values.division) fd.append("division", values.division)

      if (user) {
        const result = await updateDnpecUser(fd)
        if ("error" in result) {
          toast.error(result.error)
          return
        }

        onOpenChange(false)
        toast.success("Utilisateur mis à jour.")
        onSaved({
          ...user,
          full_name: values.full_name,
          role: values.role,
          phone: values.phone || null,
          division: values.division || null,
        })
      } else {
        const created = values as CreateValues
        const result = await createDnpecUser(fd)
        if ("error" in result) {
          toast.error(result.error)
          return
        }

        onOpenChange(false)
        toast.success("Compte DNPEC créé.")
        onSaved({
          id: crypto.randomUUID(),
          email: created.email,
          full_name: created.full_name,
          role: created.role,
          account_status: "validated",
          phone: created.phone || null,
          division: created.division || null,
          last_sign_in_at: null,
          created_at: new Date().toISOString(),
        })
        onCreatedTemporaryPassword(created.email, result.temporary_password)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur DNPEC"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettez à jour le profil et le rôle de ce membre du personnel DNPEC."
              : "Créez un compte pour un membre du personnel DNPEC. Un mot de passe temporaire sera généré."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isEdit && (
            <FormInput
              control={form.control}
              name="email"
              label="Adresse email"
              required
              type="email"
              placeholder="prenom.nom@dnpec.gouv.gn"
            />
          )}
          <FormInput
            control={form.control}
            name="full_name"
            label="Nom complet"
            required
            placeholder="Ex. : Mariama Bah"
          />
          <FormSelect
            control={form.control}
            name="role"
            label="Rôle"
            required
            options={ROLE_OPTIONS}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              control={form.control}
              name="phone"
              label="Téléphone"
              placeholder="+224 622 000 000"
            />
            <FormInput
              control={form.control}
              name="division"
              label="Division / Service"
              placeholder="Ex. : Direction des statistiques"
            />
          </div>

          {!isEdit && (
            <div className="flex items-start gap-2 rounded-lg border border-status-warn/30 bg-status-warn-bg px-3.5 py-3 text-xs text-status-warn-text">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                Un mot de passe temporaire sera généré et affiché une seule fois après la création.
                Communiquez-le à l&apos;utilisateur par un canal sécurisé.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le compte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Reveal of the one-time temporary password ────────────────────── */
interface PasswordRevealProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string | null
  password: string | null
}

export function TemporaryPasswordDialog({ open, onOpenChange, email, password }: PasswordRevealProps) {
  function copy() {
    if (!password) return
    navigator.clipboard.writeText(password).then(
      () => toast.success("Mot de passe copié."),
      () => toast.error("Impossible de copier — copiez-le manuellement."),
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compte créé</DialogTitle>
          <DialogDescription>
            Voici le mot de passe temporaire de <strong>{email}</strong>. Il ne sera plus affiché —
            transmettez-le à l&apos;utilisateur par un canal sécurisé (en main propre, appel téléphonique…).
            Cette plateforme ne propose pas encore de procédure self-service de changement de mot de passe ;
            l&apos;utilisateur devra se connecter avec celui-ci.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-3">
          <code className="flex-1 font-mono text-sm text-foreground tracking-wide select-all">
            {password}
          </code>
          <Button type="button" variant="outline" size="sm" onClick={copy} className="gap-1.5 shrink-0">
            <Copy className="size-3.5" />
            Copier
          </Button>
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" onClick={() => onOpenChange(false)}>
            J&apos;ai noté le mot de passe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
