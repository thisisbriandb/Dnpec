"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { formatDate } from "@/lib/format"

export type TargetRow = {
  status: string
  created_at: string
  campaign: {
    id: string
    title: string
    reference_period: string
    status: string
    opens_at: string
    closes_at: string
  } | null
}

const columns: ColumnDef<TargetRow>[] = [
  {
    id: "campaign",
    header: "Campagne",
    cell: ({ row }) =>
      row.original.campaign ? (
        <Link
          href={`/direction/campagnes/${row.original.campaign.id}`}
          className="font-medium hover:text-primary transition-colors"
        >
          {row.original.campaign.title}
        </Link>
      ) : (
        "—"
      ),
  },
  {
    id: "period",
    header: "Période",
    size: 120,
    enableSorting: false,
    cell: ({ row }) => row.original.campaign?.reference_period ?? "—",
  },
  {
    id: "campaign_status",
    header: "Statut campagne",
    size: 140,
    enableSorting: false,
    cell: ({ row }) => (
      <StatusBadge status={row.original.campaign?.status ?? "draft"} />
    ),
  },
  {
    id: "target_status",
    header: "Participation",
    size: 130,
    enableSorting: false,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "opens_at",
    header: "Ouverture",
    size: 110,
    enableSorting: false,
    cell: ({ row }) => formatDate(row.original.campaign?.opens_at),
  },
  {
    id: "closes_at",
    header: "Clôture",
    size: 110,
    enableSorting: false,
    cell: ({ row }) => formatDate(row.original.campaign?.closes_at),
  },
]

interface Props {
  data: TargetRow[]
}

export function CompanyTargetsTable({ data }: Props) {
  return (
    <DataTable
      data={data}
      columns={columns}
      emptyState={{
        title: "Aucune participation",
        description: "Cette entreprise n'a pas encore été ciblée par une campagne.",
      }}
    />
  )
}
