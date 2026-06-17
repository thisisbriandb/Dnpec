"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient, createClient } from "@/app/lib/supabase/server";
import { createNotificationForDirection } from "./notifications";
import { NOTIF } from "@/lib/notif-types";

function companyInsertErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    if (error.message.includes("contact_email")) {
      return "Cet email est déjà utilisé par une autre entreprise.";
    }
    if (error.message.includes("nif")) {
      return "Ce NIF est déjà enregistré dans le système.";
    }
  }
  return error.message;
}

export async function sendOtpAction(email: string): Promise<{ error?: string }> {
  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) return { error: "Adresse email invalide" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("rate limit") || msg.includes("too many"))
      return { error: "Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer." };
    return { error: error.message };
  }
  return {};
}

export async function verifyOtpAction(email: string, token: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("expired") || msg.includes("invalid"))
      return { error: "Code incorrect ou expiré. Vérifiez le code ou demandez-en un nouveau." };
    return { error: error.message };
  }
  return {};
}

const completeRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  nif: z.string().min(3),
  rccm: z.string().optional(),
  name: z.string().min(2),
  sector_id: z.string().uuid(),
  size: z.enum(["tpe", "pme", "grande_entreprise"]),
  legal_status: z.enum(["sa", "sarl", "suarl", "gie", "public", "autre"]),
  phone: z.string().min(6),
  address: z.string().optional(),
  creation_year: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().int().min(1800).max(2100).optional(),
  ),
});

export async function completeRegistrationAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const parsed = completeRegistrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };

  const { email, password, full_name, phone, nif, rccm, name, sector_id, size, legal_status, address, creation_year } = parsed.data;

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Session expirée. Veuillez recommencer depuis le début." };

  const { error: updateError } = await supabase.auth.updateUser({
    password,
    data: { full_name, phone, role: "entreprise" },
  });
  if (updateError) return { error: updateError.message };

  const admin = createAdminClient();

  await admin.from("profiles").update({ full_name, phone, role: "entreprise" }).eq("id", user.id);

  const { data: company, error: companyError } = await admin.from("companies").insert({
    profile_id: user.id,
    nif,
    rccm: rccm || null,
    name,
    sector_id,
    size,
    legal_status,
    contact_email: email,
    phone,
    address: address || null,
    creation_year: creation_year || null,
    account_status: "pending",
  }).select("id").single();

  if (companyError) return { error: companyInsertErrorMessage(companyError) };

  // Notifier la direction qu'une nouvelle inscription est en attente
  await createNotificationForDirection(
    company.id,
    NOTIF.INSCRIPTION_SOUMISE,
    `Nouvelle inscription — ${name}`,
    `L'entreprise "${name}" (NIF : ${nif}) a soumis une demande d'inscription.`,
    { nif, sector_id },
  );

  await supabase.auth.signOut();
  return { success: true };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const companySignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  nif: z.string().min(3),
  rccm: z.string().optional(),
  name: z.string().min(2),
  sector_id: z.string().uuid(),
  size: z.enum(["tpe", "pme", "grande_entreprise"]),
  legal_status: z.enum(["sa", "sarl", "suarl", "gie", "public", "autre"]),
  phone: z.string().min(6),
  address: z.string().optional(),
  creation_year: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.coerce.number().int().min(1800).max(2100).optional(),
  ),
});

export async function signIn(formData: FormData) {
  const fields = loginSchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword(fields);

  if (error || !data.user) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Connexion impossible")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role ?? (data.user.user_metadata?.role as string) ?? "entreprise";
  redirect(role === "entreprise" ? "/portail" : "/direction/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signUpCompany(formData: FormData) {
  const fields = companySignupSchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: fields.email,
    password: fields.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: {
        full_name: fields.full_name,
        role: "entreprise",
      },
    },
  });

  if (error || !data.user) {
    redirect(`/inscription?error=${encodeURIComponent(error?.message ?? "Inscription impossible")}`);
  }

  const admin = createAdminClient();
  const { error: companyError } = await admin.from("companies").insert({
    profile_id: data.user.id,
    nif: fields.nif,
    rccm: fields.rccm || null,
    name: fields.name,
    sector_id: fields.sector_id,
    size: fields.size,
    legal_status: fields.legal_status,
    contact_email: fields.email,
    phone: fields.phone,
    address: fields.address || null,
    creation_year: fields.creation_year || null,
    account_status: "pending",
  });

  if (companyError) {
    redirect(`/inscription?error=${encodeURIComponent(companyInsertErrorMessage(companyError))}`);
  }

  redirect("/login?message=Verifiez votre email, puis attendez la validation DNPEC.");
}

export async function signUpCompanyAction(formData: FormData): Promise<{ error: string }> {
  const parsed = companySignupSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const fields = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: fields.email,
    password: fields.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: { full_name: fields.full_name, role: "entreprise" },
    },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Inscription impossible" };
  }

  const admin = createAdminClient();
  const { error: companyError } = await admin.from("companies").insert({
    profile_id: data.user.id,
    nif: fields.nif,
    rccm: fields.rccm || null,
    name: fields.name,
    sector_id: fields.sector_id,
    size: fields.size,
    legal_status: fields.legal_status,
    contact_email: fields.email,
    phone: fields.phone,
    address: fields.address || null,
    creation_year: fields.creation_year || null,
    account_status: "pending",
  });

  if (companyError) {
    return { error: companyInsertErrorMessage(companyError) };
  }

  redirect("/login?message=" + encodeURIComponent("Vérifiez votre email, puis attendez la validation DNPEC."));
}
