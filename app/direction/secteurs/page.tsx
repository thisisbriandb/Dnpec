import { createClient } from "@/app/lib/supabase/server"
import { SectorsTableClient, type TableSector } from "@/app/direction/_components/sectors-table-client"

export const dynamic = "force-dynamic"

export default async function SecteursPage() {
  const supabase = await createClient()

  const [{ data: sectors }, { data: companySectors }, { data: campaignSectors }, { data: templateSectors }] =
    await Promise.all([
      supabase
        .from("sectors")
        .select("id, code, name, description, is_active, created_at")
        .order("name"),
      supabase.from("companies").select("sector_id"),
      supabase.from("campaigns").select("sector_id"),
      supabase.from("form_templates").select("sector_id"),
    ])

  const countBySector = new Map<string, number>()
  for (const row of (companySectors ?? []) as { sector_id: string }[]) {
    countBySector.set(row.sector_id, (countBySector.get(row.sector_id) ?? 0) + 1)
  }

  const campaignCountBySector = new Map<string, number>()
  for (const row of (campaignSectors ?? []) as { sector_id: string }[]) {
    campaignCountBySector.set(row.sector_id, (campaignCountBySector.get(row.sector_id) ?? 0) + 1)
  }

  const sectorIdsWithTemplate = new Set(
    ((templateSectors ?? []) as { sector_id: string }[]).map((row) => row.sector_id),
  )

  const rows: TableSector[] = (sectors ?? []).map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    description: s.description,
    is_active: s.is_active,
    company_count: countBySector.get(s.id) ?? 0,
    campaign_count: campaignCountBySector.get(s.id) ?? 0,
    has_form_template: sectorIdsWithTemplate.has(s.id),
    created_at: s.created_at,
  }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary font-mono mb-1">
          Administration · Référentiels
        </p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Secteurs économiques</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez les secteurs DNPEC utilisés pour classer les entreprises, les campagnes et les formulaires.
          La désactivation d&apos;un secteur le retire des nouvelles affectations sans supprimer les données existantes.
        </p>
      </div>

      <SectorsTableClient initialData={rows} />
    </div>
  )
}
