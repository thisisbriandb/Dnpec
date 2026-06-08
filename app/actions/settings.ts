"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/app/lib/supabase/server";

const updateSettingSchema = z.object({
  key: z.string().min(1, "Clé manquante."),
  // Valeur encodée en JSON côté client (nombre, tableau, objet…) — le type
  // dépend de la clé, voir les valeurs initiales dans la migration dnpec_core.
  value: z.string().min(1, "Valeur manquante."),
});

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    return { ok: false, error: "Accès refusé : réservé au super administrateur." } as const;
  }

  return { ok: true, supabase, user } as const;
}

export async function updateSystemSetting(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return { error: guard.error };

  const parsed = updateSettingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Données invalides." };
  }

  let value: unknown;
  try {
    value = JSON.parse(parsed.data.value);
  } catch {
    return { error: "Valeur invalide : le format JSON est incorrect." };
  }

  const { error } = await guard.supabase
    .from("system_settings")
    .update({
      value,
      updated_by: guard.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", parsed.data.key);

  if (error) return { error: error.message };

  revalidatePath("/direction/parametres");
  return { success: true };
}
