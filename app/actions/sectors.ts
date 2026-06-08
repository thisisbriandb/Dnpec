"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/app/lib/supabase/server";

const uuidSchema = z.string().uuid();

const sectorSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Code requis (2 caractères minimum)")
    .max(20, "Code trop long (20 caractères maximum)")
    .regex(/^[A-Za-z0-9_-]+$/, "Code : lettres, chiffres, tirets et underscores uniquement"),
  name: z.string().trim().min(2, "Nom requis (2 caractères minimum)").max(120, "Nom trop long"),
  description: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().max(1000, "Description trop longue").optional(),
  ),
});

const updateSectorSchema = sectorSchema.extend({ id: z.string().uuid() });

async function requireSectorManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "analyste"].includes(profile.role)) {
    return { ok: false, error: "Accès refusé : rôle insuffisant." } as const;
  }

  return { ok: true, supabase, user } as const;
}

export async function createSector(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const guard = await requireSectorManager();
  if (!guard.ok) return { error: guard.error };

  const parsed = sectorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Données invalides." };
  }

  const { code, name, description } = parsed.data;
  const { error } = await guard.supabase.from("sectors").insert({
    code: code.toUpperCase(),
    name,
    description: description ?? null,
    created_by: guard.user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "Ce code secteur est déjà utilisé." };
    return { error: error.message };
  }

  revalidatePath("/direction/secteurs");
  return { success: true };
}

export async function updateSector(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const guard = await requireSectorManager();
  if (!guard.ok) return { error: guard.error };

  const parsed = updateSectorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Données invalides." };
  }

  const { id, code, name, description } = parsed.data;
  const { error } = await guard.supabase
    .from("sectors")
    .update({ code: code.toUpperCase(), name, description: description ?? null })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Ce code secteur est déjà utilisé." };
    return { error: error.message };
  }

  revalidatePath("/direction/secteurs");
  revalidatePath("/direction/entreprises");
  return { success: true };
}

export async function setSectorActive(
  id: string,
  isActive: boolean,
): Promise<{ success: true } | { error: string }> {
  const idCheck = uuidSchema.safeParse(id);
  if (!idCheck.success) return { error: "Identifiant invalide." };

  const guard = await requireSectorManager();
  if (!guard.ok) return { error: guard.error };

  const { error } = await guard.supabase
    .from("sectors")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/direction/secteurs");
  revalidatePath("/direction/entreprises");
  return { success: true };
}

/**
 * Suppression définitive — réservée aux secteurs sans aucune dépendance
 * (ni entreprise, ni campagne, ni formulaire). Dans tous les autres cas,
 * la désactivation (`setSectorActive`) est la seule voie : `companies` et
 * `campaigns` référencent `sectors` sans cascade (la suppression échouerait
 * de toute façon), et `form_templates.sector_id` est en `on delete cascade`
 * — supprimer un secteur encore lié à un formulaire effacerait silencieusement
 * ce formulaire et tout son historique de versions.
 */
export async function deleteSector(id: string): Promise<{ success: true } | { error: string }> {
  const idCheck = uuidSchema.safeParse(id);
  if (!idCheck.success) return { error: "Identifiant invalide." };

  const guard = await requireSectorManager();
  if (!guard.ok) return { error: guard.error };

  const [{ count: companyCount }, { count: campaignCount }, { count: templateCount }] = await Promise.all([
    guard.supabase.from("companies").select("id", { count: "exact", head: true }).eq("sector_id", id),
    guard.supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("sector_id", id),
    guard.supabase.from("form_templates").select("id", { count: "exact", head: true }).eq("sector_id", id),
  ]);

  if ((companyCount ?? 0) > 0 || (campaignCount ?? 0) > 0 || (templateCount ?? 0) > 0) {
    return {
      error:
        "Suppression impossible : ce secteur est encore utilisé par au moins une entreprise, campagne ou un formulaire. Désactivez-le plutôt.",
    };
  }

  const { error } = await guard.supabase.from("sectors").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { error: "Suppression impossible : ce secteur est référencé ailleurs dans le système." };
    }
    return { error: error.message };
  }

  revalidatePath("/direction/secteurs");
  revalidatePath("/direction/entreprises");
  return { success: true };
}
