"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/app/lib/supabase/server";

const fieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum([
    "short_text",
    "long_text",
    "integer",
    "decimal",
    "date",
    "single_select",
    "multi_select",
    "checkbox",
    "data_table",
    "file",
  ]),
  required: z.boolean(),
  unit: z.string().optional(),
  min: z.number().optional(),
  options: z.array(z.string()).optional(),
});

const sectionSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  fields: z.array(fieldSchema),
});

const formSchemaPayload = z.object({
  sections: z.array(sectionSchema),
});

type FormSchemaPayload = z.infer<typeof formSchemaPayload>;

export async function saveFormVersionDraft(
  templateId: string,
  versionId: string | null,
  schema: FormSchemaPayload,
): Promise<{ versionId: string } | { error: string }> {
  const schemaValidation = formSchemaPayload.safeParse(schema);
  if (!schemaValidation.success) {
    return { error: "Schéma invalide : " + schemaValidation.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  if (versionId) {
    const { data, error } = await supabase
      .from("form_versions")
      .update({ schema: schemaValidation.data })
      .eq("id", versionId)
      .eq("status", "draft")
      .select("id")
      .single();

    if (error) return { error: error.message };
    revalidatePath(`/direction/formulaires/${templateId}`);
    return { versionId: data.id };
  }

  const { data: existing } = await supabase
    .from("form_versions")
    .select("version_number")
    .eq("template_id", templateId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (existing?.version_number ?? 0) + 1;

  const { data, error } = await supabase
    .from("form_versions")
    .insert({
      template_id: templateId,
      version_number: nextVersion,
      status: "draft",
      schema: schemaValidation.data,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/direction/formulaires/${templateId}`);
  return { versionId: data.id };
}

export async function publishFormVersion(
  templateId: string,
  versionId: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error: publishError } = await supabase
    .from("form_versions")
    .update({
      status: "published",
      published_by: user.id,
      published_at: new Date().toISOString(),
    })
    .eq("id", versionId)
    .eq("status", "draft");

  if (publishError) return { error: publishError.message };

  const { error: templateError } = await supabase
    .from("form_templates")
    .update({ current_version_id: versionId })
    .eq("id", templateId);

  if (templateError) return { error: templateError.message };

  const { error: archiveError } = await supabase
    .from("form_versions")
    .update({ status: "archived" })
    .eq("template_id", templateId)
    .eq("status", "published")
    .neq("id", versionId);

  if (archiveError) return { error: archiveError.message };

  revalidatePath(`/direction/formulaires/${templateId}`);
  revalidatePath("/direction/formulaires");
  return { success: true };
}
