"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient, createClient } from "@/app/lib/supabase/server";
import { createNotification } from "./notifications";
import { NOTIF } from "@/lib/notif-types";

const uuidSchema = z.string().uuid();

const rejectSchema = z.object({
  company_id: z.string().uuid(),
  rejection_reason: z.string().min(10, "Le motif doit contenir au moins 10 caractères.").max(500),
});

const createByDirectionSchema = z.object({
  // Section 1 — Identité légale
  nif: z.string().min(3, "NIF requis"),
  rccm: z.string().optional(),
  name: z.string().min(2, "Nom requis"),
  sigle: z.string().optional(),
  legal_status: z.enum(["sa", "sarl", "suarl", "gie", "public", "autre"]),
  date_creation: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().optional(),
  ),
  // Section 2 — Classification
  sector_id: z.string().uuid("Secteur requis"),
  activite_nace: z.string().optional(),
  capital_social: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().min(0).optional(),
  ),
  size: z.enum(["tpe", "pme", "grande_entreprise"]),
  // Section 3 — Localisation
  region: z.string().optional(),
  commune: z.string().optional(),
  address: z.string().optional(),
  // Section 4 — Contact & Responsable
  nom_dg: z.string().optional(),
  responsable_dnpec: z.string().optional(),
  contact_email: z.string().email("Email invalide"),
  phone: z.string().min(6, "Téléphone requis"),
  // Champ de compatibilité ascendante
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

  // Notifier l'entreprise
  const admin = createAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("profile_id, name")
    .eq("id", id)
    .single();

  if (company?.profile_id) {
    await createNotification({
      recipientId: company.profile_id,
      companyId:   id,
      type:  NOTIF.INSCRIPTION_VALIDEE,
      title: "Inscription validée",
      body:  `Votre inscription pour "${company.name}" a été validée par la DNPEC. Vous pouvez maintenant accéder à votre espace entreprise.`,
    });
  }

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

  // Notifier l'entreprise
  const admin = createAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("profile_id, name")
    .eq("id", company_id)
    .single();

  if (company?.profile_id) {
    await createNotification({
      recipientId: company.profile_id,
      companyId:   company_id,
      type:  NOTIF.INSCRIPTION_REJETEE,
      title: "Inscription rejetée",
      body:  `Votre inscription pour "${company.name}" a été rejetée. Motif : ${rejection_reason}`,
    });
  }

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

  // Notifier l'entreprise
  const admin = createAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("profile_id, name")
    .eq("id", id)
    .single();

  if (company?.profile_id) {
    await createNotification({
      recipientId: company.profile_id,
      companyId:   id,
      type:  NOTIF.COMPTE_SUSPENDU,
      title: "Compte suspendu",
      body:  `L'accès de "${company.name}" a été suspendu par la DNPEC. Contactez-nous pour plus d'informations.`,
    });
  }

  revalidatePath("/direction/entreprises");
  revalidatePath(`/direction/entreprises/${id}`);
  return { success: true };
}

export async function createCompanyByDirection(
  formData: FormData,
): Promise<{ error: string } | { company_id: string }> {
  const raw = Object.fromEntries(formData);
  const parsed = createByDirectionSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const d = parsed.data;

  // Extraire l'année depuis date_creation pour rétrocompatibilité
  const derivedYear = d.date_creation
    ? new Date(d.date_creation).getFullYear()
    : (d.creation_year ?? null);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("companies")
    .insert({
      nif: d.nif,
      rccm: d.rccm || null,
      name: d.name,
      sigle: d.sigle || null,
      legal_status: d.legal_status,
      date_creation: d.date_creation || null,
      sector_id: d.sector_id,
      activite_nace: d.activite_nace || null,
      capital_social: d.capital_social ?? null,
      size: d.size,
      region: d.region || null,
      commune: d.commune || null,
      address: d.address || null,
      nom_dg: d.nom_dg || null,
      responsable_dnpec: d.responsable_dnpec || null,
      contact_email: d.contact_email,
      phone: d.phone,
      creation_year: derivedYear,
      account_status: "validated",
      profile_id: null,
      created_by: user.id,
      validated_by: user.id,
      validated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Ce NIF est déjà enregistré dans le système." };
    }
    return { error: error.message };
  }

  revalidatePath("/direction/entreprises");
  return { company_id: data.id };
}

const DOC_TYPES = ["rccm", "attestation_nif", "bilan_comptable"] as const;
type DocType = (typeof DOC_TYPES)[number];

export async function uploadCompanyDocument(
  companyId: string,
  docType: DocType,
  formData: FormData,
): Promise<{ path: string } | { error: string }> {
  // Valider les paramètres
  const idCheck = uuidSchema.safeParse(companyId);
  if (!idCheck.success) return { error: "Identifiant entreprise invalide." };
  if (!DOC_TYPES.includes(docType)) return { error: "Type de document invalide." };

  // Vérifier l'authentification et le rôle
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "analyste", "agent_saisie"].includes(profile.role)) {
    return { error: "Accès refusé : rôle insuffisant." };
  }

  // Récupérer le fichier
  const file = formData.get("file");
  if (!file || !(file instanceof File)) return { error: "Fichier manquant." };
  if (file.size === 0) return { error: "Le fichier est vide." };
  if (file.size > 10 * 1024 * 1024) return { error: "Fichier trop volumineux (max 10 Mo)." };

  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${companyId}/${docType}/${Date.now()}.${ext}`;

  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from("company-docs")
    .upload(storagePath, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await admin.from("company_documents").insert({
    company_id: companyId,
    doc_type: docType,
    storage_path: storagePath,
    uploaded_by: user.id,
  });

  if (dbError) {
    // Supprimer l'objet storage si l'insertion DB échoue
    await admin.storage.from("company-docs").remove([storagePath]);
    return { error: dbError.message };
  }

  return { path: storagePath };
}
