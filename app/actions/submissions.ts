"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"

type Answers = Record<string, string | string[]>

type FormField = { key: string; required: boolean }
type FormSection = { fields: FormField[] }
type FormSchema = { sections: FormSection[] }

function computeCompletionRate(schema: FormSchema, answers: Answers): number {
  const required = schema.sections.flatMap((s) => s.fields).filter((f) => f.required)
  if (required.length === 0) return 100
  const filled = required.filter((f) => {
    const v = answers[f.key]
    if (v === undefined || v === null) return false
    if (Array.isArray(v)) return v.length > 0
    return String(v).trim() !== ""
  })
  return Number(((filled.length / required.length) * 100).toFixed(2))
}

export async function saveDraft(
  campaignId: string,
  answers: Answers,
): Promise<{ submissionId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("profile_id", user.id)
    .single()
  if (!company) return { error: "Entreprise introuvable." }

  const { data: target } = await supabase
    .from("campaign_targets")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("company_id", company.id)
    .maybeSingle()
  if (!target) return { error: "Accès non autorisé à cette campagne." }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, status, form_template_id")
    .eq("id", campaignId)
    .eq("status", "active")
    .maybeSingle()
  if (!campaign) return { error: "Cette campagne n'accepte plus de réponses." }

  const { data: template } = await supabase
    .from("form_templates")
    .select("schema")
    .eq("id", campaign.form_template_id)
    .single()

  const schema = (template?.schema ?? { sections: [] }) as FormSchema
  const completionRate = computeCompletionRate(schema, answers)

  const { data: existing } = await supabase
    .from("submissions")
    .select("id, status")
    .eq("campaign_id", campaignId)
    .eq("company_id", company.id)
    .maybeSingle()

  let submissionId: string

  if (!existing) {
    const { data, error } = await supabase
      .from("submissions")
      .insert({
        campaign_id:     campaignId,
        company_id:      company.id,
        status:          "draft",
        answers,
        completion_rate: completionRate,
        created_by:      user.id,
      })
      .select("id")
      .single()
    if (error) return { error: error.message }
    submissionId = data.id
  } else {
    const newStatus = existing.status === "correction_requested" ? "draft" : existing.status
    const { error } = await supabase
      .from("submissions")
      .update({ answers, completion_rate: completionRate, status: newStatus })
      .eq("id", existing.id)
    if (error) return { error: error.message }
    submissionId = existing.id
  }

  revalidatePath(`/portail/campagnes/${campaignId}`)
  revalidatePath("/portail/campagnes")

  return { submissionId }
}

export async function validateSubmission(
  submissionId: string,
): Promise<void | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!profile || !["super_admin", "analyste"].includes(profile.role)) {
    return { error: "Accès refusé." }
  }

  const { data: sub } = await supabase
    .from("submissions")
    .select("campaign_id")
    .eq("id", submissionId)
    .single()
  if (!sub) return { error: "Soumission introuvable." }

  const { error } = await supabase
    .from("submissions")
    .update({ status: "validated", validated_by: user.id, validated_at: new Date().toISOString(), rejection_comment: null })
    .eq("id", submissionId)
  if (error) return { error: error.message }

  revalidatePath(`/direction/campagnes/${sub.campaign_id}`)
  revalidatePath("/direction/campagnes")
}

export async function rejectSubmission(
  submissionId: string,
  comment: string,
): Promise<void | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!profile || !["super_admin", "analyste"].includes(profile.role)) {
    return { error: "Accès refusé." }
  }

  if (!comment.trim()) return { error: "Un motif de rejet est requis." }

  const { data: sub } = await supabase
    .from("submissions")
    .select("campaign_id")
    .eq("id", submissionId)
    .single()
  if (!sub) return { error: "Soumission introuvable." }

  const { error } = await supabase
    .from("submissions")
    .update({ status: "rejected", rejection_comment: comment })
    .eq("id", submissionId)
  if (error) return { error: error.message }

  revalidatePath(`/direction/campagnes/${sub.campaign_id}`)
  revalidatePath("/direction/campagnes")
}

export async function requestCorrection(
  submissionId: string,
  comment: string,
): Promise<void | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!profile || !["super_admin", "analyste"].includes(profile.role)) {
    return { error: "Accès refusé." }
  }

  if (!comment.trim()) return { error: "Un message de retour est requis." }

  const { data: sub } = await supabase
    .from("submissions")
    .select("campaign_id")
    .eq("id", submissionId)
    .single()
  if (!sub) return { error: "Soumission introuvable." }

  const { error } = await supabase
    .from("submissions")
    .update({ status: "correction_requested", rejection_comment: comment })
    .eq("id", submissionId)
  if (error) return { error: error.message }

  revalidatePath(`/direction/campagnes/${sub.campaign_id}`)
  revalidatePath("/direction/campagnes")
  revalidatePath("/portail/campagnes")
}

export async function submitSubmission(
  submissionId: string,
): Promise<void | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("profile_id", user.id)
    .single()
  if (!company) return { error: "Entreprise introuvable." }

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, status, campaign_id, company_id")
    .eq("id", submissionId)
    .single()
  if (!submission) return { error: "Soumission introuvable." }
  if (submission.company_id !== company.id) return { error: "Accès refusé." }
  if (submission.status !== "draft") return { error: "Cette soumission ne peut plus être soumise." }

  const { error: subError } = await supabase
    .from("submissions")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", submissionId)
  if (subError) return { error: subError.message }

  await supabase
    .from("campaign_targets")
    .update({ status: "submitted" })
    .eq("campaign_id", submission.campaign_id)
    .eq("company_id", company.id)

  revalidatePath(`/portail/campagnes/${submission.campaign_id}`)
  revalidatePath("/portail/campagnes")
  revalidatePath("/portail/dashboard")

  redirect("/portail/campagnes")
}
