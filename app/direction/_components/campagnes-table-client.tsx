"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Megaphone } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { formatDate } from "@/lib/format"

const PERIODICITY_LABELS: Record<string, string> = {
  monthly: "Mensuelle",
  quarterly: "Trimestrielle",
  annual: "Annuelle",
  one_off: "Ponctuelle",
}

export type CampaignRow = {
  id: string
  title: string
  reference_period: string
  periodicity: string
  status: string
  opens_at: string
  closes_at: string
  created_at: string
  sector: { name: string } | null
  form_version: { version_number: number } | null
}

const columns: ColumnDef<CampaignRow>[] = [
  {
    accessorKey: "title",
    header: "Titre",
    cell: ({ row }) => (
      <Link
        href={`/direction/campagnes/${row.original.id}`}
        className="block min-w-0 hover:text-primary transition-colors"
      >
        <p className="font-medium truncate">{row.original.title}</p>
        <p className="text-xs text-muted-foreground">{row.original.reference_period}</p>
      </Link>
    ),
  },
  {
    id: "sector",
    header: "Secteur",
    size: 110,
    enableSorting: false,
    cell: ({ row }) => row.original.sector?.name ?? "—",
  },
  {
    id: "form_version",
    header: "Formulaire",
    size: 100,
    enableSorting: false,
    cell: ({ row }) =>
      row.original.form_version ? (
        <span className="font-mono text-sm">v{row.original.form_version.version_number}</span>
      ) : (
        "—"
      ),
  },
  {
    accessorKey: "periodicity",
    header: "Périodicité",
    size: 120,
    enableSorting: false,
    cell: ({ row }) =>
      PERIODICITY_LABELS[row.original.periodicity] ?? row.original.periodicity,
  },
  {
    accessorKey: "opens_at",
    header: "Ouverture",
    size: 110,
    cell: ({ row }) => formatDate(row.original.opens_at),
  },
  {
    accessorKey: "closes_at",
    header: "Clôture",
    size: 110,
    cell: ({ row }) => formatDate(row.original.closes_at),
  },
  {
    accessorKey: "status",
    header: "Statut",
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

interface Props {
  data: CampaignRow[]
}

export function CampagnesTableClient({ data }: Props) {
  return (
    <DataTable
      data={data}
      columns={columns}
      emptyState={{
        icon: Megaphone,
        title: "Aucune campagne",
        description: "Créez votre première campagne de collecte de données.",
      }}
    />
  )
}
