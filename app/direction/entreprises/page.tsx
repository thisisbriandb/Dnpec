import { createClient } from "@/app/lib/supabase/server"
import { EntreprisesView } from "@/app/direction/_components/entreprises-view"
import type { TableCompany } from "@/app/direction/_components/companies-table-client"
import type { InscriptionCompany } from "@/app/direction/_components/inscription-queue-client"

export const dynamic = "force-dynamic"

type SectorRaw = {
  sector_id: string
  sector: { id: string; name: string } | null
}

export default async function EntreprisesPage() {
  const supabase = await createClient()

  const [
    { data: sectors },
    { count: total },
    { count: validated },
    { count: pending },
    { count: rejected },
    { count: suspended },
    { data: companies, count: tableCount },
    { data: sectorRaw },
    { data: inscriptions },
  ] = await Promise.all([
    supabase.from("sectors").select("id, name").eq("is_active", true).order("name"),
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("account_status", "validated"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("account_status", "pending"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("account_status", "rejected"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("account_status", "suspended"),
    supabase
      .from("companies")
      .select(
        `id, nif, name, account_status, size, legal_status, created_at,
         sector:sectors(id, name), validator:profiles!validated_by(full_name)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(0, 24),
    supabase.from("companies").select("sector_id, sector:sectors(id, name)"),
    supabase
      .from("companies")
      .select(`
        id, nif, rccm, name, contact_email, phone, address, creation_year,
        size, legal_status, created_at,
        sector:sectors(name),
        profile:profiles!profile_id(full_name, email, created_at)
      `)
      .eq("account_status", "pending")
      .order("created_at", { ascending: true }),
  ])

  const totalN = total ?? 0
  const validatedN = validated ?? 0
  const pendingN = pending ?? 0
  const rejectedN = rejected ?? 0
  const suspendedN = suspended ?? 0

  const sectorMap = new Map<string, { name: string; count: number }>()
  for (const row of ((sectorRaw ?? []) as unknown as SectorRaw[])) {
    const s = row.sector
    if (!s) continue
    const existing = sectorMap.get(s.id)
    if (existing) existing.count++
    else sectorMap.set(s.id, { name: s.name, count: 1 })
  }
  const sectorBreakdown = [...sectorMap.entries()]
    .map(([id, { name, count }]) => ({ id, name, count }))
    .sort((a, b) => b.count - a.count)

  const statsChips = [
    { count: validatedN, label: "validée", color: "var(--status-ok)" },
    pendingN > 0 ? { count: pendingN, label: "en attente", color: "var(--status-warn)" } : null,
    rejectedN + suspendedN > 0
      ? { count: rejectedN + suspendedN, label: "inactive", color: "var(--status-bad)" }
      : null,
  ].filter(Boolean) as { count: number; label: string; color: string }[]

  return (
    <EntreprisesView
      totalN={totalN}
      statsChips={statsChips}
      initialData={(companies ?? []) as unknown as TableCompany[]}
      sectors={sectors ?? []}
      total={tableCount ?? 0}
      sectorBreakdown={sectorBreakdown}
      totalCompanies={totalN}
      pendingInscriptions={(inscriptions ?? []) as unknown as InscriptionCompany[]}
    />
  )
}
