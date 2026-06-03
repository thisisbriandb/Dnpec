import { redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import { FormulaireLayoutClient } from "./_components/formulaires-layout-client"
import type { SectorItem, FormSchema } from "./_components/formulaires-layout-client"

export const dynamic = "force-dynamic"

export default async function FormulairesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: sectors } = await supabase
    .from("sectors")
    .select("id, code, name, description")
    .eq("is_active", true)
    .order("name")

  const { data: templates } = await supabase
    .from("form_templates")
    .select(`
      id, title, description, status, schema, published_at, sector_id,
      publisher:profiles!published_by(full_name)
    `)

  const { data: activeCampaigns } = await supabase
    .from("campaigns")
    .select("form_template_id")
    .in("status", ["scheduled", "active"])

  // template lookup by sector
  const templateBySector = new Map(
    (templates ?? []).map((t) => [t.sector_id, t])
  )

  // active campaign count per template
  const campaignCountByTemplate = new Map<string, number>()
  for (const c of activeCampaigns ?? []) {
    const prev = campaignCountByTemplate.get(c.form_template_id) ?? 0
    campaignCountByTemplate.set(c.form_template_id, prev + 1)
  }

  const sectorItems: SectorItem[] = (sectors ?? []).map((s) => {
    const tpl = templateBySector.get(s.id)
    if (!tpl) {
      return {
        id: s.id,
        code: s.code,
        name: s.name,
        description: s.description ?? null,
        template: null,
      }
    }
    const publisher = tpl.publisher as unknown as { full_name: string } | null
    return {
      id: s.id,
      code: s.code,
      name: s.name,
      description: s.description ?? null,
      template: {
        id: tpl.id,
        title: tpl.title,
        description: tpl.description ?? null,
        status: tpl.status as "draft" | "published",
        schema: (tpl.schema ?? { sections: [] }) as FormSchema,
        published_at: tpl.published_at ?? null,
        publisher_name: publisher?.full_name ?? null,
        active_campaign_count: campaignCountByTemplate.get(tpl.id) ?? 0,
      },
    }
  })

  return <FormulaireLayoutClient sectors={sectorItems} />
}
