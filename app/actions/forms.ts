"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/app/lib/supabase/server"

/* ── Validation schema ──────────────────────────────────────────── */
const fieldSchema = z.object({
  key:      z.string().min(1),
  label:    z.string().min(1),
  type:     z.enum(["short_text","long_text","integer","decimal","date",
                    "single_select","multi_select","checkbox","data_table","file"]),
  required: z.boolean(),
  unit:     z.string().optional(),
  min:      z.number().optional(),
  options:  z.array(z.string()).optional(),
})

const sectionSchema = z.object({
  key:    z.string().min(1),
  title:  z.string().min(1),
  fields: z.array(fieldSchema),
})

const formSchemaPayload = z.object({
  sections: z.array(sectionSchema),
})

type FormSchemaPayload = z.infer<typeof formSchemaPayload>

/* ── Helper : un formulaire publié est verrouillé et ne peut plus être modifié ── */
async function checkEditable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  templateId: string,
): Promise<string | null> {
  const { data: template } = await supabase
    .from("form_templates")
    .select("status")
    .eq("id", templateId)
    .single()

  if (template?.status === "published") {
    return "Ce formulaire est publié : il ne peut plus être modifié."
  }
  return null
}

/* ── createFormTemplate ─────────────────────────────────────────── */
export async function createFormTemplate(
  sectorId: string,
  schema: FormSchemaPayload,
): Promise<{ templateId: string } | { error: string }> {
  const parsed = formSchemaPayload.safeParse(schema)
  if (!parsed.success) {
    return { error: "Schéma invalide : " + parsed.error.issues[0]?.message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  // Vérifier qu'il n'existe pas déjà un template pour ce secteur
  const { data: existing } = await supabase
    .from("form_templates")
    .select("id")
    .eq("sector_id", sectorId)
    .maybeSingle()

  if (existing) return { error: "Un formulaire existe déjà pour ce secteur." }

  // Récupérer le nom du secteur pour le titre
  const { data: sector } = await supabase
    .from("sectors")
    .select("name")
    .eq("id", sectorId)
    .single()

  if (!sector) return { error: "Secteur introuvable." }

  const { data, error } = await supabase
    .from("form_templates")
    .insert({
      sector_id:  sectorId,
      title:      `Formulaire de collecte — ${sector.name}`,
      schema:     parsed.data,
      status:     "draft",
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/direction/formulaires")
  return { templateId: data.id }
}

/* ── saveFormSchema ─────────────────────────────────────────────── */
export async function saveFormSchema(
  templateId: string,
  schema: FormSchemaPayload,
): Promise<{ success: true } | { error: string }> {
  const parsed = formSchemaPayload.safeParse(schema)
  if (!parsed.success) {
    return { error: "Schéma invalide : " + parsed.error.issues[0]?.message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  const editError = await checkEditable(supabase, templateId)
  if (editError) return { error: editError }

  const { error } = await supabase
    .from("form_templates")
    .update({ schema: parsed.data })
    .eq("id", templateId)

  if (error) return { error: error.message }

  revalidatePath(`/direction/formulaires/${templateId}`)
  return { success: true }
}

/* ── publishFormSchema ──────────────────────────────────────────── */
export async function publishFormSchema(
  templateId: string,
  schema: FormSchemaPayload,
): Promise<{ success: true } | { error: string }> {
  const parsed = formSchemaPayload.safeParse(schema)
  if (!parsed.success) {
    return { error: "Schéma invalide : " + parsed.error.issues[0]?.message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  const editError = await checkEditable(supabase, templateId)
  if (editError) return { error: editError }

  const { error } = await supabase
    .from("form_templates")
    .update({
      schema:       parsed.data,
      status:       "published",
      published_by: user.id,
      published_at: new Date().toISOString(),
    })
    .eq("id", templateId)

  if (error) return { error: error.message }

  revalidatePath(`/direction/formulaires/${templateId}`)
  revalidatePath("/direction/formulaires")
  return { success: true }
}
