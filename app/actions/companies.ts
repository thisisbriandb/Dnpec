"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient, createClient } from "@/app/lib/supabase/server";

const uuidSchema = z.string().uuid();

const rejectSchema = z.object({
  company_id: z.string().uuid(),
  rejection_reason: z.string().min(10, "Le motif doit contenir au moins 10 caractères.").max(500),
});

const createByDirectionSchema = z.object({
  nif: z.string().min(3, "NIF requis"),
  rccm: z.string().optional(),
  name: z.string().min(2, "Nom requis"),
  sector_id: z.string().uuid("Secteur requis"),
  size: z.enum(["tpe", "pme", "grande_entreprise"]),
  legal_status: z.enum(["sa", "sarl", "suarl", "gie", "public", "autre"]),
  contact_email: z.string().email("Email invalide"),
  phone: z.string().min(6, "Téléphone requis"),
  address: z.string().optional(),
  creation_year: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().int().min(1800).max(2100).optional(),
  ),
});

export async function validateCompany(
  id: string,
): Promise<{ success: true } | { error: string }> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { error: "Identifiant invalide." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase
    .from("companies")
    .update({
      account_status: "validated",
      validated_by: user.id,
      validated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/direction/entreprises/inscriptions");
  revalidatePath("/direction/entreprises");
  return { success: true };
}

export async function rejectCompany(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const raw = Object.fromEntries(formData);
  const parsed = rejectSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Données invalides." };
  }

  const { company_id, rejection_reason } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("companies")
    .update({ account_status: "rejected", rejection_reason })
    .eq("id", company_id);

  if (error) return { error: error.message };

  revalidatePath("/direction/entreprises/inscriptions");
  revalidatePath("/direction/entreprises");
  return { success: true };
}

export async function suspendCompany(
  id: string,
): Promise<{ success: true } | { error: string }> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { error: "Identifiant invalide." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("companies")
    .update({ account_status: "suspended" })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/direction/entreprises");
  revalidatePath(`/direction/entreprises/${id}`);
  return { success: true };
}

export async function createCompanyByDirection(
  formData: FormData,
): Promise<{ error: string } | void> {
  const raw = Object.fromEntries(formData);
  const parsed = createByDirectionSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const admin = createAdminClient();
  const { error } = await admin.from("companies").insert({
    nif: parsed.data.nif,
    rccm: parsed.data.rccm || null,
    name: parsed.data.name,
    sector_id: parsed.data.sector_id,
    size: parsed.data.size,
    legal_status: parsed.data.legal_status,
    contact_email: parsed.data.contact_email,
    phone: parsed.data.phone,
    address: parsed.data.address || null,
    creation_year: parsed.data.creation_year || null,
    account_status: "validated",
    profile_id: null,
    created_by: user.id,
    validated_by: user.id,
    validated_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ce NIF est déjà enregistré dans le système." };
    }
    return { error: error.message };
  }

  revalidatePath("/direction/entreprises");
  redirect("/direction/entreprises");
}
