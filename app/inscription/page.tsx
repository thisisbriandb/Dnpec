import { createClient } from "@/app/lib/supabase/server";
import InscriptionForm from "./_components/inscription-form";

export const dynamic = "force-dynamic";

async function getSectors() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return [];
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("sectors")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export default async function SignupPage() {
  const sectors = await getSectors();
  return <InscriptionForm sectors={sectors} />;
}
