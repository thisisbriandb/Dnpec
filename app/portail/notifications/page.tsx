import { redirect } from "next/navigation"
import { Bell } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { EmptyState } from "@/components/ui/empty-state"
import { NotificationsClient } from "./_components/notifications-client"

export const dynamic = "force-dynamic"

export default async function PortailNotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, created_at, read_at")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })

  const list = notifications ?? []

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-display font-semibold text-foreground">Notifications</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Toutes les mises à jour de votre dossier DNPEC.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border shadow-subtle">
          <EmptyState
            icon={Bell}
            title="Aucune notification"
            description="Vous verrez ici les mises à jour de votre dossier une fois que la DNPEC aura traité votre demande."
            size="md"
          />
        </div>
      ) : (
        <NotificationsClient notifications={list} />
      )}
    </div>
  )
}
