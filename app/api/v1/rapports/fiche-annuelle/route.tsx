import { z } from "zod"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/app/lib/supabase/server"
import { buildAnnualFiche, type AnnualFicheErrorCode } from "@/lib/reports/annual-fiche"
import { AnnualFicheDocument } from "@/lib/reports/pdf/annual-fiche-document"

export const dynamic = "force-dynamic"

const querySchema = z.object({
  company_id: z.string().uuid("Identifiant entreprise invalide."),
  year: z.coerce.number().int().min(2000).max(2100),
  format: z.enum(["pdf"]).default("pdf"),
})

const ERROR_RESPONSES: Record<AnnualFicheErrorCode, { status: number; message: string }> = {
  company_not_found: { status: 404, message: "Entreprise introuvable." },
  no_form_template: {
    status: 422,
    message: "Aucun formulaire publié n'existe pour le secteur de cette entreprise.",
  },
  no_rubriques: {
    status: 422,
    message: "Le formulaire de ce secteur ne contient aucune rubrique exploitable dans un rapport.",
  },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    company_id: searchParams.get("company_id"),
    year: searchParams.get("year"),
    format: searchParams.get("format") ?? undefined,
  })

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Paramètres invalides." },
      { status: 400 },
    )
  }

  const { company_id: companyId, year, format } = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "Non authentifié." }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "super_admin" && profile?.role !== "analyste") {
    return Response.json(
      { error: "Seuls les rôles super admin et analyste peuvent générer ce rapport." },
      { status: 403 },
    )
  }

  const result = await buildAnnualFiche(companyId, year)
  if (!result.ok) {
    const mapped = ERROR_RESPONSES[result.code]
    return Response.json({ error: mapped.message }, { status: mapped.status })
  }

  if (format === "pdf") {
    const pdfDocument = <AnnualFicheDocument fiche={result.fiche} />
    let buffer: Buffer
    try {
      buffer = await renderToBuffer(pdfDocument)
    } catch {
      return Response.json(
        { error: "Échec de la génération du PDF." },
        { status: 500 },
      )
    }

    const filename = `fiche-annuelle-${slugify(result.fiche.company.name)}-${year}.pdf`
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    })
  }

  return Response.json({ error: "Format non pris en charge." }, { status: 400 })
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
