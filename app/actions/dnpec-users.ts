"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createAdminClient } from "@/app/lib/supabase/server";

const uuidSchema = z.string().uuid();

const DNPEC_ROLES = ["super_admin", "analyste", "agent_saisie"] as const;

const createUserSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  full_name: z.string().trim().min(2, "Nom requis (2 caractères minimum)").max(150, "Nom trop long"),
  role: z.enum(DNPEC_ROLES, { message: "Rôle invalide." }),
  phone: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  division: z.preprocess((v) => (v === "" ? undefined : v), z.string().max(120).optional()),
});

const updateUserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(2, "Nom requis (2 caractères minimum)").max(150, "Nom trop long"),
  role: z.enum(DNPEC_ROLES, { message: "Rôle invalide." }),
  phone: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  division: z.preprocess((v) => (v === "" ? undefined : v), z.string().max(120).optional()),
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

function generateTemporaryPassword(): string {
  // 16 caractères alphanumériques lisibles, suffisamment forts pour un mot de passe initial.
  return randomBytes(12).toString("base64url");
}

export async function createDnpecUser(
  formData: FormData,
): Promise<{ success: true; temporary_password: string } | { error: string }> {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return { error: guard.error };

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Données invalides." };
  }

  const { email, full_name, role, phone, division } = parsed.data;
  const temporaryPassword = generateTemporaryPassword();

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name, role, phone: phone ?? undefined },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return { error: "Un compte existe déjà avec cette adresse email." };
    }
    return { error: error.message };
  }
  if (!data.user) return { error: "La création du compte a échoué." };

  // Le trigger handle_new_auth_user crée la ligne profiles (nom, rôle, statut, téléphone).
  // On complète ici la division, qui n'est pas portée par les métadonnées auth.
  if (division) {
    await admin.from("profiles").update({ division }).eq("id", data.user.id);
  }

  revalidatePath("/direction/utilisateurs");
  return { success: true, temporary_password: temporaryPassword };
}

export async function updateDnpecUser(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return { error: guard.error };

  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Données invalides." };
  }

  const { id, full_name, role, phone, division } = parsed.data;

  const { error } = await guard.supabase
    .from("profiles")
    .update({
      full_name,
      role,
      phone: phone ?? null,
      division: division ?? null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/direction/utilisateurs");
  return { success: true };
}

export async function setDnpecUserStatus(
  id: string,
  status: "validated" | "suspended",
): Promise<{ success: true } | { error: string }> {
  const idCheck = uuidSchema.safeParse(id);
  if (!idCheck.success) return { error: "Identifiant invalide." };

  const guard = await requireSuperAdmin();
  if (!guard.ok) return { error: guard.error };

  if (status === "suspended" && id === guard.user.id) {
    return { error: "Vous ne pouvez pas suspendre votre propre compte." };
  }

  const { error } = await guard.supabase
    .from("profiles")
    .update({ account_status: status })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/direction/utilisateurs");
  return { success: true };
}
