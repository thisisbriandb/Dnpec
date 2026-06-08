"use client"

import * as React from "react"
import { useTransition } from "react"
import { toast } from "sonner"
import { Plus, Users, MoreHorizontal, Pencil, Ban, RotateCcw } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { SearchInput } from "@/components/ui/search-input"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { UserFormDialog, TemporaryPasswordDialog } from "./user-form-dialog"
import { setDnpecUserStatus } from "@/app/actions/dnpec-users"
import { formatRelative, formatDate } from "@/lib/format"
import { ROLE_LABELS, type AppRole, type AccountStatus } from "@/lib/status"
import { cn } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

/* ── Types ──────────────────────────────────────────────────────── */
export type DnpecRole = "super_admin" | "analyste" | "agent_saisie"

export type TableDnpecUser = {
  id: string
  email: string
  full_name: string
  role: DnpecRole
  account_status: string
  phone: string | null
  division: string | null
  last_sign_in_at: string | null
  created_at: string
}

const ROLE_TABS: Array<{ value: ""; label: string } | { value: DnpecRole; label: string }> = [
  { value: "", label: "Tous" },
  { value: "super_admin", label: ROLE_LABELS.super_admin },
  { value: "analyste", label: ROLE_LABELS.analyste },
  { value: "agent_saisie", label: ROLE_LABELS.agent_saisie },
]

const ROLE_CHIP_CLASS: Record<DnpecRole, string> = {
  super_admin: "bg-status-purple-bg text-status-purple-text",
  analyste: "bg-status-info-bg text-status-info-text",
  agent_saisie: "bg-status-gray-bg text-status-gray-text",
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface Props {
  initialData: TableDnpecUser[]
  currentUserId: string
}

export function UsersTableClient({ initialData, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [data, setData] = React.useState<TableDnpecUser[]>(initialData)
  const [search, setSearch] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<"" | DnpecRole>("")
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<TableDnpecUser | null>(null)
  const [pwdReveal, setPwdReveal] = React.useState<{ email: string; password: string } | null>(null)

  const filtered = React.useMemo(() => {
    let rows = data
    if (roleFilter) rows = rows.filter((u) => u.role === roleFilter)
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      )
    }
    return rows
  }, [data, search, roleFilter])

  function handleSaved(user: TableDnpecUser) {
    setData((prev) => {
      const exists = prev.some((u) => u.id === user.id)
      if (exists) return prev.map((u) => (u.id === user.id ? { ...u, ...user } : u))
      return [user, ...prev]
    })
  }

  function handleCreatedTemporaryPassword(email: string, password: string) {
    setPwdReveal({ email, password })
  }

  function handleSetStatus(user: TableDnpecUser, status: "validated" | "suspended") {
    startTransition(async () => {
      const result = await setDnpecUserStatus(user.id, status)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(status === "suspended" ? "Compte suspendu." : "Compte réactivé.")
      setData((prev) => prev.map((u) => (u.id === user.id ? { ...u, account_status: status } : u)))
    })
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(user: TableDnpecUser) {
    setEditing(user)
    setFormOpen(true)
  }

  const columns: ColumnDef<TableDnpecUser>[] = [
    {
      id: "user",
      header: "Utilisateur",
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="flex items-center gap-3 py-0.5">
            <div className="size-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 select-none ring-1 ring-black/5 bg-surface-2 text-foreground">
              {getInitials(u.full_name)}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate leading-tight">
                {u.full_name}
                {u.id === currentUserId && (
                  <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(vous)</span>
                )}
              </p>
              <span className="text-[11px] text-muted-foreground tracking-wide truncate">{u.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: "role",
      header: "Rôle",
      size: 150,
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original.role
        return (
          <span className={cn("inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md", ROLE_CHIP_CLASS[r])}>
            {ROLE_LABELS[r]}
          </span>
        )
      },
    },
    {
      id: "division",
      header: "Division",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate">{row.original.division || "—"}</span>
      ),
    },
    {
      accessorKey: "account_status",
      header: "Statut",
      size: 120,
      enableSorting: false,
      cell: ({ row }) => <StatusBadge status={row.original.account_status as AccountStatus} />,
    },
    {
      id: "last_sign_in_at",
      header: "Dernière connexion",
      size: 160,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.last_sign_in_at ? formatRelative(row.original.last_sign_in_at) : "Jamais connecté"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Créé le",
      size: 110,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.created_at)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      size: 56,
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original
        const isSelf = u.id === currentUserId
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-7")}
                aria-label="Actions"
              >
                <MoreHorizontal className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem disabled={isSelf} onClick={() => openEdit(u)}>
                  <Pencil className="size-3.5" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {u.account_status === "suspended" ? (
                  <DropdownMenuItem disabled={isPending || isSelf} onClick={() => handleSetStatus(u, "validated")}>
                    <RotateCcw className="size-3.5" />
                    Réactiver
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    disabled={isPending || isSelf}
                    onClick={() => handleSetStatus(u, "suspended")}
                    className="text-status-bad-text focus:bg-status-bad-bg focus:text-status-bad-text"
                  >
                    <Ban className="size-3.5" />
                    Suspendre
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          placeholder="Rechercher un utilisateur…"
          onChange={setSearch}
          className="w-64"
        />

        <div className="flex items-center bg-secondary rounded-lg p-0.5 gap-px">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setRoleFilter(tab.value as "" | DnpecRole)}
              className={cn(
                "px-3 h-7 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                roleFilter === tab.value
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </span>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="size-4" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <DataTable
        data={filtered}
        columns={columns}
        emptyState={{
          icon: Users,
          title: "Aucun utilisateur trouvé",
          description: "Modifiez les filtres ou créez un nouveau compte DNPEC.",
          action: { label: "Nouvel utilisateur", onClick: openCreate },
        }}
      />

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        onSaved={handleSaved}
        onCreatedTemporaryPassword={handleCreatedTemporaryPassword}
      />

      <TemporaryPasswordDialog
        open={pwdReveal !== null}
        onOpenChange={(open) => { if (!open) setPwdReveal(null) }}
        email={pwdReveal?.email ?? null}
        password={pwdReveal?.password ?? null}
      />
    </div>
  )
}

// Re-export pour le formulaire (évite un import circulaire avec lib/status)
export type { AppRole }
