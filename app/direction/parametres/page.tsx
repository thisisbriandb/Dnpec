import { redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import { SystemSettingsClient, type TableSetting } from "@/app/direction/_components/system-settings-client"

export const dynamic = "force-dynamic"

export default async function ParametresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "super_admin") redirect("/direction/dashboard")

  const { data: settings } = await supabase
    .from("system_settings")
    .select("key, value, updated_by, updated_at, updater:profiles!updated_by(full_name)")
    .order("key")

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary font-mono mb-1">
          Administration · Système
        </p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Paramètres système</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Réglages globaux de la plateforme DNPEC — sécurité, authentification, fichiers et notifications.
          Réservé au super administrateur.
        </p>
      </div>

      <SystemSettingsClient initialData={(settings ?? []) as unknown as TableSetting[]} />
    </div>
  )
}
