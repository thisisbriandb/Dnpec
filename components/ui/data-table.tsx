"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
} from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown, Columns3, Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonTableRow } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/* ── Native checkbox cell (avoids Base UI complexity) ────────── */
function TableCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  const ref = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate
  }, [indeterminate])

  return (
    <label className="flex items-center justify-center cursor-pointer">
      <span className="sr-only">{label}</span>
      <div
        className={cn(
          "flex size-4 items-center justify-center rounded border-2 transition-colors",
          "focus-within:ring-2 focus-within:ring-ring/40",
          checked || indeterminate
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background"
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
          aria-label={label}
        />
        {indeterminate ? (
          <Minus className="size-2.5" strokeWidth={3} />
        ) : checked ? (
          <Check className="size-2.5" strokeWidth={3} />
        ) : null}
      </div>
    </label>
  )
}

/* ── Column header with sort ──────────────────────────────────── */
function SortableHeader({
  label,
  sorted,
  onSort,
}: {
  label: string
  sorted: false | "asc" | "desc"
  onSort: (event?: unknown) => void
}) {
  return (
    <button
      type="button"
      onClick={onSort}
      className="flex items-center gap-1 group/sort hover:text-foreground transition-colors text-left"
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="size-3 text-primary" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3 text-primary" />
      ) : (
        <ArrowUpDown className="size-3 opacity-0 group-hover/sort:opacity-50 transition-opacity" />
      )}
    </button>
  )
}

/* ── DataTable ────────────────────────────────────────────────── */
export interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  loading?: boolean
  skeletonRows?: number
  pagination?: {
    pageIndex: number
    pageSize: number
    pageCount: number
    total?: number
    onPaginationChange: (state: PaginationState) => void
  }
  selectable?: boolean
  onSelectionChange?: (rows: TData[]) => void
  bulkActions?: React.ReactNode
  emptyState?: {
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
    title: string
    description?: string
    action?: { label: string; onClick: () => void }
  }
  className?: string
  stickyHeader?: boolean
}

function DataTable<TData>({
  data,
  columns: userColumns,
  loading = false,
  skeletonRows = 8,
  pagination,
  selectable = false,
  onSelectionChange,
  bulkActions,
  emptyState,
  className,
  stickyHeader = true,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const selectionColumn: ColumnDef<TData, unknown> = {
    id: "select",
    header: ({ table }) => (
      <TableCheckbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onChange={(v) => table.toggleAllPageRowsSelected(v)}
        label="Sélectionner toutes les lignes"
      />
    ),
    cell: ({ row }) => (
      <TableCheckbox
        checked={row.getIsSelected()}
        onChange={(v) => row.toggleSelected(v)}
        label={`Sélectionner ligne ${row.index + 1}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  }

  const columns = selectable ? [selectionColumn, ...userColumns] : userColumns

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      columnFilters,
      columnVisibility,
      ...(pagination && {
        pagination: {
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
        },
      }),
    },
    manualPagination: !!pagination,
    pageCount: pagination?.pageCount,
    enableRowSelection: selectable,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(pagination && {
      onPaginationChange: (updater) => {
        const next =
          typeof updater === "function"
            ? updater({ pageIndex: pagination.pageIndex, pageSize: pagination.pageSize })
            : updater
        pagination.onPaginationChange(next)
      },
    }),
  })

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original)

  React.useEffect(() => {
    onSelectionChange?.(selectedRows)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection])

  const hasSelection = Object.keys(rowSelection).length > 0
  const headerGroups = table.getHeaderGroups()
  const rows = table.getRowModel().rows

  const EmptyIcon = emptyState?.icon

  return (
    <div className={cn("flex flex-col gap-0", className)}>
      {/* Selection action bar */}
      {selectable && hasSelection && (
        <div className="flex items-center justify-between gap-4 rounded-t-lg border border-b-0 border-primary/20 bg-primary/5 px-3 py-2">
          <span className="text-xs font-medium text-primary">
            {Object.keys(rowSelection).length} sélectionné
            {Object.keys(rowSelection).length > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            {bulkActions}
            <button
              type="button"
              onClick={() => setRowSelection({})}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-6 text-xs")}
            >
              Désélectionner
            </button>
          </div>
        </div>
      )}

      {/* Table container */}
      <div className="overflow-auto rounded-card border border-border">
        <table className="w-full border-collapse text-sm">
          <thead
            className={cn("bg-surface-2", stickyHeader && "sticky top-0 z-10")}
          >
            {headerGroups.map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <SortableHeader
                        label={String(
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                        sorted={header.column.getIsSorted()}
                        onSort={header.column.getToggleSortingHandler()!}
                      />
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <SkeletonTableRow key={i} columns={columns.length} />
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-0">
                  {emptyState ? (
                    <EmptyState
                      icon={EmptyIcon as React.ComponentType<{ className?: string }> | undefined}
                      title={emptyState.title}
                      description={emptyState.description}
                      action={emptyState.action}
                      size="md"
                    />
                  ) : (
                    <EmptyState
                      title="Aucun résultat"
                      description="Aucune donnée à afficher pour les filtres sélectionnés."
                      size="md"
                    />
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={cn(
                    "border-b border-border last:border-b-0 transition-colors",
                    "hover:bg-surface-2",
                    row.getIsSelected() && "bg-primary/5"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Column visibility */}
      <div className="flex items-center justify-between gap-4 pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-7 gap-1.5 text-xs text-muted-foreground"
            )}
          >
            <Columns3 className="size-3.5" />
            Colonnes
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  className="text-sm capitalize"
                >
                  {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export { DataTable }
