"use client"

import * as React from "react"
import { useTransition } from "react"
import { toast } from "sonner"
import { Plus, Layers, MoreHorizontal, Pencil, Ban, RotateCcw, Trash2, TriangleAlert } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { buttonVariants } from "@/components/ui/button"
import { SectorFormDialog } from "./sector-form-dialog"
import { setSectorActive, deleteSector } from "@/app/actions/sectors"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

/* ── Types ──────────────────────────────────────────────────────── */
export type TableSector = {
  id: string
  code: string
  name: string
  description: string | null
  is_active: boolean
  company_count: number
  campaign_count: number
  has_form_template: boolean
  created_at: string
}

function sectorDependencyReasons(sector: TableSector): string[] {
  const reasons: string[] = []
  if (sector.company_count > 0) {
    reasons.push(`${sector.company_count} entreprise${sector.company_count > 1 ? "s" : ""}`)
  }
  if (sector.campaign_count > 0) {
    reasons.push(`${sector.campaign_count} campagne${sector.campaign_count > 1 ? "s" : ""}`)
  }
  if (sector.has_form_template) reasons.push("un formulaire")
  return reasons
}

const STATUS_TABS = [
  { value: "", label: "Tous" },
  { value: "active", label: "Actifs" },
  { value: "inactive", label: "Inactifs" },
]

interface Props {
  initialData: TableSector[]
}

export function SectorsTableClient({ initialData }: Props) {
  const [isPending, startTransition] = useTransition()
  const [data, setData] = React.useState<TableSector[]>(initialData)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<TableSector | null>(null)
  const [deleting, setDeleting] = React.useState<TableSector | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const filtered = React.useMemo(() => {
    let rows = data
    if (statusFilter === "active") rows = rows.filter((s) => s.is_active)
    if (statusFilter === "inactive") rows = rows.filter((s) => !s.is_active)
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
      )
    }
    return rows
  }, [data, search, statusFilter])

  function handleSaved(sector: TableSector) {
    setData((prev) => {
      const exists = prev.some((s) => s.id === sector.id)
      if (exists) return prev.map((s) => (s.id === sector.id ? { ...s, ...sector } : s))
      return [sector, ...prev]
    })
  }

  function handleToggleActive(sector: TableSector) {
    const nextActive = !sector.is_active
    startTransition(async () => {
      const result = await setSectorActive(sector.id, nextActive)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(nextActive ? "Secteur réactivé." : "Secteur désactivé.")
      setData((prev) => prev.map((s) => (s.id === sector.id ? { ...s, is_active: nextActive } : s)))
    })
  }

  function handleDelete(sector: TableSector) {
    startTransition(async () => {
      const result = await deleteSector(sector.id)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Secteur supprimé.")
      setDeleteOpen(false)
      setData((prev) => prev.filter((s) => s.id !== sector.id))
    })
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(sector: TableSector) {
    setEditing(sector)
    setFormOpen(true)
  }

  function openDelete(sector: TableSector) {
    setDeleting(sector)
    setDeleteOpen(true)
  }

  const columns: ColumnDef<TableSector>[] = [
    {
      id: "sector",
      header: "Secteur",
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate leading-tight">{s.name}</p>
            <span className="font-mono text-[11px] text-muted-foreground tracking-wide">
              {s.code}
            </span>
          </div>
        )
      },
    },
    {
      id: "description",
      header: "Description",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-1">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      id: "company_count",
      header: "Entreprises",
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-foreground">{row.original.company_count}</span>
      ),
    },
    {
      id: "is_active",
      header: "Statut",
      size: 110,
      enableSorting: false,
      cell: ({ row }) => {
        const active = row.original.is_active
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium border",
              active
                ? "bg-status-ok-bg text-status-ok-text border-status-ok/30"
                : "bg-status-gray-bg text-status-gray-text border-status-gray/30",
            )}
          >
            <span className={cn("size-1.5 rounded-full", active ? "bg-status-ok" : "bg-status-gray")} />
            {active ? "Actif" : "Inactif"}
          </span>
        )
      },
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
        const s = row.original
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-7")}
                aria-label="Actions"
              >
                <MoreHorizontal className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => openEdit(s)}>
                  <Pencil className="size-3.5" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {s.is_active ? (
                  <DropdownMenuItem
                    disabled={isPending}
                    onClick={() => handleToggleActive(s)}
                    className="text-status-bad-text focus:bg-status-bad-bg focus:text-status-bad-text"
                  >
                    <Ban className="size-3.5" />
                    Désactiver
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled={isPending} onClick={() => handleToggleActive(s)}>
                    <RotateCcw className="size-3.5" />
                    Réactiver
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => openDelete(s)}
                  className="text-status-bad-text focus:bg-status-bad-bg focus:text-status-bad-text"
                >
                  <Trash2 className="size-3.5" />
                  Supprimer
                </DropdownMenuItem>
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
          placeholder="Rechercher un secteur…"
          onChange={setSearch}
          className="w-64"
        />

        <div className="flex items-center bg-secondary rounded-lg p-0.5 gap-px">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "px-3 h-7 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                statusFilter === tab.value
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
            Nouveau secteur
          </Button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <DataTable
        data={filtered}
        columns={columns}
        emptyState={{
          icon: Layers,
          title: "Aucun secteur trouvé",
          description: "Modifiez les filtres ou créez un nouveau secteur économique.",
          action: { label: "Nouveau secteur", onClick: openCreate },
        }}
      />

      <SectorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        sector={editing}
        onSaved={handleSaved}
      />

      {/* ── Confirmation de suppression ──────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          {deleting && (() => {
            const reasons = sectorDependencyReasons(deleting)
            const blocked = reasons.length > 0
            return blocked ? (
              <>
                <DialogHeader>
                  <DialogTitle>Suppression impossible</DialogTitle>
                  <DialogDescription>
                    Le secteur <strong>{deleting.name}</strong> est encore utilisé par {reasons.join(", ")}.
                    Une suppression romprait ces données. Désactivez le secteur plutôt — il sera retiré
                    des nouvelles affectations sans toucher à l&apos;existant.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-2">
                  <Button type="button" onClick={() => setDeleteOpen(false)}>
                    Compris
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TriangleAlert className="size-4 text-status-bad-text" />
                    Supprimer définitivement ce secteur ?
                  </DialogTitle>
                  <DialogDescription>
                    Le secteur <strong>{deleting.name}</strong> ({deleting.code}) n&apos;est utilisé par
                    aucune entreprise, campagne ou formulaire. Cette action est <strong>irréversible</strong>.
                    Si vous n&apos;êtes pas certain, préférez le désactiver.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-2">
                  <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDelete(deleting)}
                    disabled={isPending}
                  >
                    {isPending ? "Suppression…" : "Supprimer définitivement"}
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
