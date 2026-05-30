"use client"

import * as React from "react"
import Link from "next/link"
import { useTransition } from "react"
import { toast } from "sonner"
import { Building2, MoreHorizontal } from "lucide-react"
import { createClient } from "@/app/lib/supabase/browser"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { SearchInput } from "@/components/ui/search-input"
import { FilterChips } from "@/components/ui/filter-chips"
import { Pagination } from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { buttonVariants } from "@/components/ui/button"
import { validateCompany, suspendCompany } from "@/app/actions/companies"
import { formatNIF, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"
import type { AccountStatus } from "@/lib/status"

export type TableCompany = {
  id: string
  nif: string
  name: string
  account_status: string
  size: string
  legal_status: string
  created_at: string
  sector: { id: string; name: string } | null
  validator: { full_name: string } | null
}

const SIZE_LABELS: Record<string, string> = {
  tpe: "TPE",
  pme: "PME",
  grande_entreprise: "Grande entreprise",
}

interface Props {
  initialData: TableCompany[]
  sectors: { id: string; name: string }[]
  total: number
}

const PAGE_SIZE = 25

export function CompaniesTableClient({ initialData, sectors, total }: Props) {
  const [isPending, startTransition] = useTransition()
  const [data, setData] = React.useState<TableCompany[]>(initialData)
  const [totalCount, setTotalCount] = React.useState(total)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [sectorFilter, setSectorFilter] = React.useState("")
  const [page, setPage] = React.useState(0)
  const [loading, setLoading] = React.useState(false)

  const activeFilters = [
    statusFilter && { key: "status", label: "Statut", value: statusFilter },
    sectorFilter && { key: "sector", label: "Secteur", value: sectors.find((s) => s.id === sectorFilter)?.name ?? sectorFilter },
  ].filter(Boolean) as { key: string; label: string; value: string }[]

  React.useEffect(() => {
    let cancelled = false

    async function fetchData() {
      if (!cancelled) setLoading(true)
      const supabase = createClient()
      let query = supabase
        .from("companies")
        .select(
          `id, nif, name, account_status, size, legal_status, created_at,
           sector:sectors(id, name),
           validator:profiles!validated_by(full_name)`,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      if (search.trim()) query = query.ilike("name", `%${search.trim()}%`)
      if (statusFilter) query = query.eq("account_status", statusFilter)
      if (sectorFilter) query = query.eq("sector_id", sectorFilter)

      const { data: result, count } = await query
      if (!cancelled) {
        setData((result as unknown as TableCompany[]) ?? [])
        setTotalCount(count ?? 0)
        setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [search, statusFilter, sectorFilter, page])

  function handleSearch(value: string) {
    setSearch(value)
    setPage(0)
  }

  function handleRemoveFilter(key: string) {
    if (key === "status") { setStatusFilter(""); setPage(0) }
    if (key === "sector") { setSectorFilter(""); setPage(0) }
  }

  function handleReset() {
    setStatusFilter("")
    setSectorFilter("")
    setPage(0)
  }

  function handleValidate(id: string) {
    startTransition(async () => {
      const result = await validateCompany(id)
      if ("error" in result) toast.error(result.error)
      else {
        toast.success("Entreprise validée.")
        setData((prev) =>
          prev.map((c) => (c.id === id ? { ...c, account_status: "validated" } : c))
        )
      }
    })
  }

  function handleSuspend(id: string) {
    startTransition(async () => {
      const result = await suspendCompany(id)
      if ("error" in result) toast.error(result.error)
      else {
        toast.success("Entreprise suspendue.")
        setData((prev) =>
          prev.map((c) => (c.id === id ? { ...c, account_status: "suspended" } : c))
        )
      }
    })
  }

  const columns: ColumnDef<TableCompany>[] = [
    {
      accessorKey: "nif",
      header: "NIF",
      size: 120,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-mono">{formatNIF(row.original.nif)}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Entreprise",
      cell: ({ row }) => (
        <Link
          href={`/direction/entreprises/${row.original.id}`}
          className="font-medium hover:text-primary transition-colors"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "sector",
      header: "Secteur",
      size: 120,
      enableSorting: false,
      cell: ({ row }) => row.original.sector?.name ?? "—",
    },
    {
      id: "size",
      header: "Taille",
      size: 130,
      enableSorting: false,
      cell: ({ row }) => SIZE_LABELS[row.original.size] ?? row.original.size,
    },
    {
      accessorKey: "account_status",
      header: "Statut",
      size: 120,
      enableSorting: false,
      cell: ({ row }) => (
        <StatusBadge status={row.original.account_status as AccountStatus} />
      ),
    },
    {
      accessorKey: "created_at",
      header: "Créée le",
      size: 110,
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: "actions",
      header: "",
      size: 48,
      enableSorting: false,
      cell: ({ row }) => {
        const status = row.original.account_status
        const id = row.original.id
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
              aria-label="Actions"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem render={<Link href={`/direction/entreprises/${id}`} />}>
                Voir le détail
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {status === "pending" && (
                <DropdownMenuItem
                  disabled={isPending}
                  onClick={() => handleValidate(id)}
                  className="text-status-ok-text focus:bg-status-ok-bg focus:text-status-ok-text"
                >
                  Valider
                </DropdownMenuItem>
              )}
              {status === "validated" && (
                <DropdownMenuItem
                  disabled={isPending}
                  onClick={() => handleSuspend(id)}
                  className="text-status-bad-text focus:bg-status-bad-bg focus:text-status-bad-text"
                >
                  Suspendre
                </DropdownMenuItem>
              )}
              {status === "suspended" && (
                <DropdownMenuItem
                  disabled={isPending}
                  onClick={() => handleValidate(id)}
                >
                  Réactiver
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          placeholder="Rechercher une entreprise…"
          onChange={handleSearch}
          loading={loading}
          className="w-72"
        />
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
          className="h-8 rounded-control border border-input bg-background px-2.5 text-sm text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="validated">Validées</option>
          <option value="rejected">Rejetées</option>
          <option value="suspended">Suspendues</option>
        </select>
        {/* Sector filter */}
        <select
          value={sectorFilter}
          onChange={(e) => { setSectorFilter(e.target.value); setPage(0) }}
          className="h-8 rounded-control border border-input bg-background px-2.5 text-sm text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 outline-none"
        >
          <option value="">Tous les secteurs</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Active filters */}
      <FilterChips
        filters={activeFilters}
        onRemove={handleRemoveFilter}
        onReset={handleReset}
      />

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        emptyState={{
          icon: Building2,
          title: "Aucune entreprise trouvée",
          description: "Modifiez les filtres ou créez une nouvelle entreprise.",
          action: { label: "Nouvelle entreprise", onClick: () => { window.location.href = "/direction/entreprises/nouveau" } },
        }}
      />

      {totalCount > PAGE_SIZE && (
        <Pagination
          page={page}
          pageCount={Math.ceil(totalCount / PAGE_SIZE)}
          total={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
