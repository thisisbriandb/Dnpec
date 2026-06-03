"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient, createClient } from "@/app/lib/supabase/server";

const contactSchema = z.object({
  phone: z.string().min(6, "Téléphone invalide (6 caractères minimum)"),
  email: z.string().email("Adresse email invalide"),
});

export async function updateContactInfo(
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Non authentifié." };

  const { phone, email } = parsed.data;
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ phone, email })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/portail/profil");
  return {};
}
