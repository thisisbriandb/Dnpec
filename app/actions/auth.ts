"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient, createClient } from "@/app/lib/supabase/server";

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

  const { error } = await supabase.auth.signInWithPassword(fields);

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/direction/dashboard");
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
    redirect(`/inscription?error=${encodeURIComponent(companyError.message)}`);
  }

  redirect("/login?message=Verifiez votre email, puis attendez la validation DNPEC.");
}
