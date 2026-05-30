import Link from "next/link"
import { Plus } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/format"
import { Megaphone } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

export const dynamic = "force-dynamic"

const PERIODICITY_LABELS: Record<string, string> = {
  monthly: "Mensuelle",
  quarterly: "Trimestrielle",
  annual: "Annuelle",
  one_off: "Ponctuelle",
}

type Campaign = {
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

const columns: ColumnDef<Campaign>[] = [
  {
    accessorKey: "title",
    header: "Titre",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="font-medium truncate">{row.original.title}</p>
        <p className="text-xs text-muted-foreground">{row.original.reference_period}</p>
      </div>
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
    size: 110,
    enableSorting: false,
    cell: ({ row }) => row.original.form_version
      ? <span className="font-mono text-sm">v{row.original.form_version.version_number}</span>
      : "—",
  },
  {
    accessorKey: "periodicity",
    header: "Périodicité",
    size: 120,
    enableSorting: false,
    cell: ({ row }) => PERIODICITY_LABELS[row.original.periodicity] ?? row.original.periodicity,
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
    size: 110,
    enableSorting: false,
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

export default async function CampagnesPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(`
      id, title, reference_period, periodicity, status, opens_at, closes_at, created_at,
      sector:sectors(name),
      form_version:form_versions(version_number)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-title font-semibold text-foreground">Campagnes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {(campaigns ?? []).length} campagne{(campaigns ?? []).length > 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href="/direction/campagnes/nouvelle" />}>
          <Plus className="size-4" />
          Nouvelle campagne
        </Button>
      </div>

      {(!campaigns || campaigns.length === 0) ? (
        <EmptyState
          icon={Megaphone}
          title="Aucune campagne"
          description="Créez votre première campagne de collecte de données."
          action={{ label: "Nouvelle campagne", onClick: () => { window.location.href = "/direction/campagnes/nouvelle" } }}
          size="lg"
        />
      ) : (
        <DataTable
          data={campaigns as unknown as Campaign[]}
          columns={columns}
          emptyState={{
            icon: Megaphone,
            title: "Aucune campagne",
            description: "Créez votre première campagne.",
          }}
        />
      )}
    </div>
  )
}
