"use server";

import { createAdminClient, createClient } from "@/app/lib/supabase/server";

export async function createNotification({
  recipientId,
  companyId,
  type,
  title,
  body,
  metadata = {},
}: {
  recipientId: string;
  companyId?: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    recipient_id: recipientId,
    company_id:   companyId ?? null,
    type,
    title,
    body,
    channels: ["in_app"],
    status:   "queued",
    metadata,
  });
}

export async function createNotificationForDirection(
  companyId: string,
  type: string,
  title: string,
  body: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const admin = createAdminClient();
  const { data: recipients } = await admin
    .from("profiles")
    .select("id")
    .in("role", ["super_admin", "analyste"]);

  if (!recipients?.length) return;

  await admin.from("notifications").insert(
    recipients.map((r) => ({
      recipient_id: r.id,
      company_id:   companyId,
      type,
      title,
      body,
      channels: ["in_app"],
      status:   "queued",
      metadata,
    })),
  );
}

export async function markNotificationRead(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);
  if (error) return { error: error.message };
  return {};
}
