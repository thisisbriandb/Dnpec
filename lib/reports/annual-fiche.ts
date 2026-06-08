import "server-only"

import { z } from "zod"
import { createClient } from "@/app/lib/supabase/server"

/**
 * Types de champs du schéma de formulaire qui ne se réduisent pas à une
 * valeur unique de cellule (pièce jointe, sous-tableau) — ils sont exclus
 * des "rubriques" de la fiche pivot annuelle.
 */
const NON_SCALAR_FIELD_TYPES = new Set(["file", "data_table"])

const schemaFieldShape = z.object({
  key: z.string(),
  label: z.string(),
  type: z.string(),
  unit: z.string().optional(),
})

const schemaSectionShape = z.object({
  fields: z.array(schemaFieldShape),
})

const formSchemaShape = z.object({
  sections: z.array(schemaSectionShape),
})

export const rubriqueSchema = z.object({
  key: z.string(),
  label: z.string(),
  unit: z.string().nullable(),
})
export type Rubrique = z.infer<typeof rubriqueSchema>

const cellValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
])
export type CellValue = z.infer<typeof cellValueSchema>

export const annualFicheSchema = z.object({
  company: z.object({
    id: z.string(),
    name: z.string(),
    responsable: z.string().nullable(),
    email: z.string(),
    phone: z.string(),
  }),
  natureDonnees: z.string().nullable(),
  year: z.number().int(),
  rubriques: z.array(rubriqueSchema),
  months: z.array(
    z.object({
      month: z.number().int().min(1).max(12),
      values: z.record(z.string(), cellValueSchema),
    }),
  ),
})
export type AnnualFiche = z.infer<typeof annualFicheSchema>

export type AnnualFicheErrorCode =
  | "company_not_found"
  | "no_form_template"
  | "no_rubriques"

export type AnnualFicheResult =
  | { ok: true; fiche: AnnualFiche }
  | { ok: false; code: AnnualFicheErrorCode }

type CompanyRow = {
  id: string
  name: string
  responsable_dnpec: string | null
  contact_email: string
  phone: string
  sector_id: string
  sector: { name: string; description: string | null } | null
}

/**
 * Assemble les données d'une "Fiche de collecte mensuelle individuelle"
 * annuelle pour une entreprise : pivot des rubriques du formulaire de son
 * secteur (lignes) contre les 12 mois de l'année choisie (colonnes).
 *
 * Source des "rubriques" : form_templates.schema du secteur de l'entreprise
 * (Règle 5 — pas de libellés métier en dur). form_templates.sector_id est
 * unique, donc le secteur détermine sans ambiguïté le formulaire utilisé par
 * toutes les campagnes mensuelles de ce secteur.
 *
 * Seules les soumissions au statut "validated" alimentent les cellules.
 */
export async function buildAnnualFiche(
  companyId: string,
  year: number,
): Promise<AnnualFicheResult> {
  const supabase = await createClient()

  const { data: companyData } = await supabase
    .from("companies")
    .select(
      "id, name, responsable_dnpec, contact_email, phone, sector_id, sector:sectors(name, description)",
    )
    .eq("id", companyId)
    .maybeSingle()

  if (!companyData) return { ok: false, code: "company_not_found" }
  const company = companyData as unknown as CompanyRow

  const { data: template } = await supabase
    .from("form_templates")
    .select("schema")
    .eq("sector_id", company.sector_id)
    .eq("status", "published")
    .maybeSingle()

  if (!template) return { ok: false, code: "no_form_template" }

  const rubriques = extractRubriques(template.schema)
  if (rubriques.length === 0) return { ok: false, code: "no_rubriques" }

  const rubriqueKeys = rubriques.map((r) => r.key)

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, opens_at")
    .eq("sector_id", company.sector_id)
    .eq("periodicity", "monthly")
    .gte("opens_at", `${year}-01-01`)
    .lt("opens_at", `${year + 1}-01-01`)

  const campaignList = campaigns ?? []
  const monthByCampaignId = new Map<string, number>()
  for (const campaign of campaignList) {
    monthByCampaignId.set(campaign.id, new Date(campaign.opens_at).getUTCMonth() + 1)
  }

  const valuesByMonth = new Map<number, Record<string, CellValue>>()
  if (campaignList.length > 0) {
    const { data: submissions } = await supabase
      .from("submissions")
      .select("campaign_id, answers")
      .eq("company_id", companyId)
      .eq("status", "validated")
      .in("campaign_id", campaignList.map((c) => c.id))

    for (const submission of submissions ?? []) {
      const month = monthByCampaignId.get(submission.campaign_id)
      // Si plusieurs campagnes mensuelles ouvrent le même mois pour ce secteur
      // (cas limite, ex. campagne de correction), on garde la première trouvée.
      if (!month || valuesByMonth.has(month)) continue

      const answers = (submission.answers ?? {}) as Record<string, unknown>
      const values: Record<string, CellValue> = {}
      for (const key of rubriqueKeys) {
        values[key] = toCellValue(answers[key])
      }
      valuesByMonth.set(month, values)
    }
  }

  const months = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    return { month, values: valuesByMonth.get(month) ?? {} }
  })

  return {
    ok: true,
    fiche: {
      company: {
        id: company.id,
        name: company.name,
        responsable: company.responsable_dnpec,
        email: company.contact_email,
        phone: company.phone,
      },
      natureDonnees: company.sector?.description ?? company.sector?.name ?? null,
      year,
      rubriques,
      months,
    },
  }
}

function extractRubriques(rawSchema: unknown): Rubrique[] {
  const parsed = formSchemaShape.safeParse(rawSchema)
  if (!parsed.success) return []

  const rubriques: Rubrique[] = []
  for (const section of parsed.data.sections) {
    for (const field of section.fields) {
      if (NON_SCALAR_FIELD_TYPES.has(field.type)) continue
      rubriques.push({ key: field.key, label: field.label, unit: field.unit ?? null })
    }
  }
  return rubriques
}

function toCellValue(value: unknown): CellValue {
  const parsed = cellValueSchema.safeParse(value)
  if (parsed.success) return parsed.data
  return value == null ? null : String(value)
}
