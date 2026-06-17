import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { CampaignCreateForm } from "@/app/direction/_components/campaign-create-form"
import type { FormSchema } from "@/app/direction/_components/form-fill-preview"

export const dynamic = "force-dynamic"

export default async function NouvelleCampagnePage() {
  const supabase = await createClient()

  const [{ data: sectors }, { data: templates }, { data: companies }] = await Promise.all([
    supabase
      .from("sectors")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("form_templates")
      .select("id, sector_id, title, description, schema")
      .eq("status", "published"),
    supabase
      .from("companies")
      .select("id, nif, name, sector_id")
      .eq("account_status", "validated")
      .order("name"),
  ])

  const templateBySector = new Map((templates ?? []).map((t) => [t.sector_id, t]))

  const sectorOptions = (sectors ?? []).map((s) => {
    const tpl = templateBySector.get(s.id)
    return {
      id: s.id,
      name: s.name,
      template: tpl
        ? {
            id: tpl.id,
            title: tpl.title,
            description: tpl.description ?? null,
            schema: (tpl.schema ?? { sections: [] }) as FormSchema,
          }
        : null,
    }
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back link */}
      <Link
        href="/direction/campagnes"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Campagnes
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Nouvelle campagne</h1>
        <p className="text-sm text-muted-foreground">
          Configurez et lancez une campagne de collecte de données
        </p>
      </div>

      <CampaignCreateForm
        sectors={sectorOptions}
        allCompanies={companies ?? []}
      />
    </div>
  )
}
