"use client"

import * as React from "react"
import Link from "next/link"
import { useTransition } from "react"
import { toast } from "sonner"
import { Building2, MoreHorizontal, ExternalLink } from "lucide-react"
import { createClient } from "@/app/lib/supabase/browser"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { SearchInput } from "@/components/ui/search-input"
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

/* ── Types ──────────────────────────────────────────────────────── */
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

/* ── Constants ──────────────────────────────────────────────────── */
const PAGE_SIZE = 25

const SECTOR_PALETTE: Array<{ bg: string; text: string; bar: string }> = [
  { bg: "#EEF4FF", text: "#1B4FCE", bar: "#2563EB" },
  { bg: "#DCFCE7", text: "#166534", bar: "#16A34A" },
  { bg: "#FEF3C7", text: "#92400E", bar: "#F59E0B" },
  { bg: "#F3E8FF", text: "#6D28D9", bar: "#8B5CF6" },
  { bg: "#E0F2FE", text: "#075985", bar: "#0EA5E9" },
]

const DEFAULT_SECTOR_COLOR = { bg: "#E7EDF6", text: "#2C3E55", bar: "#6272A4" }

const STATUS_TABS = [
  { value: "", label: "Toutes" },
  { value: "validated", label: "Validées" },
  { value: "pending", label: "En attente" },
  { value: "rejected", label: "Rejetées" },
  { value: "suspended", label: "Suspendues" },
]

const SIZE_LABELS: Record<string, string> = {
  tpe: "TPE",
  pme: "PME",
  grande_entreprise: "GE",
}

const SIZE_CHIP_CLASS: Record<string, string> = {
  tpe: "bg-status-gray-bg text-status-gray-text",
  pme: "bg-status-info-bg text-status-info-text",
  grande_entreprise: "bg-status-purple-bg text-status-purple-text",
}

/* ── Helpers ────────────────────────────────────────────────────── */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

/* ── Props ──────────────────────────────────────────────────────── */
interface Props {
  initialData: TableCompany[]
  sectors: { id: string; name: string }[]
  total: number
  sectorBreakdown: { id: string; name: string; count: number }[]
  totalCompanies: number
}

/* ── Component ──────────────────────────────────────────────────── */
export function CompaniesTableClient({
  initialData,
  sectors,
  total,
  sectorBreakdown,
  totalCompanies,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [data, setData] = React.useState<TableCompany[]>(initialData)
  const [totalCount, setTotalCount] = React.useState(total)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [sectorFilter, setSectorFilter] = React.useState("")
  const [page, setPage] = React.useState(0)
  const [loading, setLoading] = React.useState(false)

  // Map sector name → color pair (stable, ordered by sector name)
  const sectorColorMap = React.useMemo(() => {
    const map = new Map<string, typeof SECTOR_PALETTE[0]>()
    sectors.forEach((s, i) => {
      map.set(s.name, SECTOR_PALETTE[i % SECTOR_PALETTE.length])
    })
    return map
  }, [sectors])

  // Data fetching
  React.useEffect(() => {
    let cancelled = false

    async function fetchData() {
      if (!cancelled) setLoading(true)
      const supabase = createClient()
      let query = supabase
        .from("companies")
        .select(
          `id, nif, name, account_status, size, legal_status, created_at,
           sector:sectors(id, name), validator:profiles!validated_by(full_name)`,
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

  function handleSearch(value: string) { setSearch(value); setPage(0) }

  function handleValidate(id: string) {
    startTransition(async () => {
      const result = await validateCompany(id)
      if ("error" in result) toast.error(result.error)
      else {
        toast.success("Entreprise validée.")
        setData((prev) => prev.map((c) => (c.id === id ? { ...c, account_status: "validated" } : c)))
      }
    })
  }

  function handleSuspend(id: string) {
    startTransition(async () => {
      const result = await suspendCompany(id)
      if ("error" in result) toast.error(result.error)
      else {
        toast.success("Entreprise suspendue.")
        setData((prev) => prev.map((c) => (c.id === id ? { ...c, account_status: "suspended" } : c)))
      }
    })
  }

  const columns: ColumnDef<TableCompany>[] = [
    {
      id: "company",
      header: "Entreprise",
      cell: ({ row }) => {
        const c = row.original
        const colors = sectorColorMap.get(c.sector?.name ?? "") ?? DEFAULT_SECTOR_COLOR
        const initials = getInitials(c.name)
        return (
          <div className="flex items-center gap-3 py-0.5">
            {/* Avatar */}
            <div
              className="size-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 select-none ring-1 ring-black/5"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {initials}
            </div>
            {/* Name + NIF */}
            <div className="min-w-0">
              <Link
                href={`/direction/entreprises/${c.id}`}
                className="block font-medium text-foreground hover:text-primary transition-colors truncate leading-tight"
              >
                {c.name}
              </Link>
              <span className="font-mono text-[11px] text-muted-foreground tracking-wide">
                {formatNIF(c.nif)}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      id: "sector",
      header: "Secteur",
      size: 130,
      enableSorting: false,
      cell: ({ row }) => {
        const sectorName = row.original.sector?.name
        const colors = sectorColorMap.get(sectorName ?? "") ?? DEFAULT_SECTOR_COLOR
        return sectorName ? (
          <div className="flex items-center gap-1.5">
            <span
              className="size-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: colors.bar }}
            />
            <span className="text-sm text-foreground">{sectorName}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      id: "size",
      header: "Taille",
      size: 80,
      enableSorting: false,
      cell: ({ row }) => {
        const s = row.original.size
        return (
          <span
            className={cn(
              "inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md",
              SIZE_CHIP_CLASS[s] ?? "bg-secondary text-secondary-foreground",
            )}
          >
            {SIZE_LABELS[s] ?? s}
          </span>
        )
      },
    },
    {
      accessorKey: "account_status",
      header: "Statut",
      size: 130,
      enableSorting: false,
      cell: ({ row }) => (
        <StatusBadge status={row.original.account_status as AccountStatus} />
      ),
    },
    {
      accessorKey: "created_at",
      header: "Enregistrée le",
      size: 120,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.created_at)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      size: 96,
      enableSorting: false,
      cell: ({ row }) => {
        const status = row.original.account_status
        const id = row.original.id
        return (
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/direction/entreprises/${id}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground",
              )}
            >
              <ExternalLink className="size-3" />
              Voir
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-7")}
                aria-label="Actions"
              >
                <MoreHorizontal className="size-3.5" />
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
                    Valider l&apos;inscription
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
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      {/* ── Sector strip ───────────────────────────────────────────── */}
      {sectorBreakdown.length > 0 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {sectorBreakdown.map(({ id, name, count }) => {
            const colors = sectorColorMap.get(name) ?? DEFAULT_SECTOR_COLOR
            const pct = totalCompanies > 0 ? Math.round((count / totalCompanies) * 100) : 0
            const isActive = sectorFilter === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => { setSectorFilter(isActive ? "" : id); setPage(0) }}
                className={cn(
                  "flex-shrink-0 w-40 rounded-xl border p-3 text-left transition-all duration-150",
                  isActive
                    ? "border-primary bg-accent shadow-sm"
                    : "border-border bg-card hover:border-border hover:shadow-subtle",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wide truncate"
                    style={{ color: isActive ? colors.bar : undefined }}
                  >
                    {name}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0 ml-1">
                    {pct}%
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden bg-secondary mb-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: colors.bar }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {count} entr.
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          placeholder="Rechercher une entreprise…"
          onChange={handleSearch}
          loading={loading}
          className="w-64"
        />

        {/* Status segmented control */}
        <div className="flex items-center bg-secondary rounded-lg p-0.5 gap-px">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => { setStatusFilter(tab.value); setPage(0) }}
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

        {/* Result count + active sector indicator */}
        <div className="ml-auto flex items-center gap-2">
          {sectorFilter && (
            <button
              type="button"
              onClick={() => { setSectorFilter(""); setPage(0) }}
              className="text-xs text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            >
              Effacer le secteur
            </button>
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            {totalCount} résultat{totalCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        emptyState={{
          icon: Building2,
          title: "Aucune entreprise trouvée",
          description: "Modifiez les filtres ou enregistrez une nouvelle entreprise.",
          action: {
            label: "Nouvelle entreprise",
            onClick: () => { window.location.href = "/direction/entreprises/nouveau" },
          },
        }}
      />

      {/* ── Pagination ─────────────────────────────────────────────── */}
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
