"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/app/lib/supabase/server";

type CampaignStatusValue = "draft" | "scheduled" | "active" | "closed" | "archived";

const createCampaignSchema = z
  .object({
    title: z.string().min(3, "Titre requis (3 car. min.)"),
    sector_id: z.string().uuid("Secteur requis"),
    form_version_id: z.string().uuid("Version de formulaire requise"),
    reference_period: z.string().min(2, "Période de référence requise"),
    periodicity: z.enum(["monthly", "quarterly", "annual", "one_off"]),
    opens_at: z.string().min(1, "Date d'ouverture requise"),
    closes_at: z.string().min(1, "Date de clôture requise"),
    target_mode: z.enum(["sector", "specific"]),
    target_company_ids: z.string().optional(),
  })
  .refine(
    (d) => new Date(d.closes_at) > new Date(d.opens_at),
    { message: "La date de clôture doit être après la date d'ouverture.", path: ["closes_at"] },
  );

export async function createCampaign(
  formData: FormData,
): Promise<{ error: string } | void> {
  const raw = Object.fromEntries(formData);
  const parsed = createCampaignSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      title: parsed.data.title,
      sector_id: parsed.data.sector_id,
      form_version_id: parsed.data.form_version_id,
      reference_period: parsed.data.reference_period,
      periodicity: parsed.data.periodicity,
      opens_at: new Date(parsed.data.opens_at).toISOString(),
      closes_at: new Date(parsed.data.closes_at).toISOString(),
      target_mode: parsed.data.target_mode,
      status: "draft",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (campaignError) return { error: campaignError.message };

  let companyIds: string[] = [];

  if (parsed.data.target_mode === "sector") {
    const { data: companies } = await supabase
      .from("companies")
      .select("id")
      .eq("sector_id", parsed.data.sector_id)
      .eq("account_status", "validated");
    companyIds = (companies ?? []).map((c) => c.id);
  } else if (parsed.data.target_company_ids) {
    try {
      companyIds = JSON.parse(parsed.data.target_company_ids) as string[];
    } catch {
      return { error: "Liste d'entreprises invalide." };
    }
  }

  if (companyIds.length > 0) {
    const targets = companyIds.map((company_id) => ({
      campaign_id: campaign.id,
      company_id,
      status: "waiting" as const,
    }));

    const { error: targetsError } = await supabase
      .from("campaign_targets")
      .insert(targets);

    if (targetsError) return { error: targetsError.message };
  }

  revalidatePath("/direction/campagnes");
  redirect("/direction/campagnes");
}

export async function updateCampaignStatus(
  id: string,
  status: CampaignStatusValue,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  const updates: Record<string, unknown> = { status };
  if (status === "active") updates.sent_at = new Date().toISOString();
  if (status === "closed") updates.closed_at = new Date().toISOString();

  const { error } = await supabase
    .from("campaigns")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/direction/campagnes");
  return { success: true };
}

export async function addCampaignTargets(
  campaignId: string,
  companyIds: string[],
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  const targets = companyIds.map((company_id) => ({
    campaign_id: campaignId,
    company_id,
    status: "waiting" as const,
  }));

  const { error } = await supabase
    .from("campaign_targets")
    .upsert(targets, { onConflict: "campaign_id,company_id", ignoreDuplicates: true });

  if (error) return { error: error.message };

  revalidatePath("/direction/campagnes");
  return { success: true };
}
