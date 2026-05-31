"use client"

import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatDate } from "@/lib/format"
import type { ColumnDef } from "@tanstack/react-table"

export type FormVersion = {
  id: string
  version_number: number
  status: string
  published_at: string | null
  created_at: string
  creator: { full_name: string } | null
}

const columns: ColumnDef<FormVersion>[] = [
  {
    accessorKey: "version_number",
    header: "Version",
    size: 90,
    cell: ({ row }) => (
      <span className="font-mono text-sm">v{row.original.version_number}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Statut",
    size: 110,
    enableSorting: false,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "published_at",
    header: "Publiée le",
    size: 120,
    cell: ({ row }) => formatDate(row.original.published_at) ?? "—",
  },
  {
    id: "creator",
    header: "Créée par",
    size: 150,
    enableSorting: false,
    cell: ({ row }) => row.original.creator?.full_name ?? "—",
  },
  {
    accessorKey: "created_at",
    header: "Date création",
    size: 120,
    cell: ({ row }) => formatDate(row.original.created_at),
  },
]

export function FormVersionsTable({ versions }: { versions: FormVersion[] }) {
  return (
    <DataTable
      data={versions}
      columns={columns}
      emptyState={{
        title: "Aucune version",
        description: "Créez la première version de ce formulaire.",
      }}
    />
  )
}
