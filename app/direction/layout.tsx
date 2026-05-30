import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import { DirectionShellClient } from "./_components/direction-shell-client"
import type { AppRole } from "@/lib/status"

export const dynamic = "force-dynamic"

export default async function DirectionLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  if (profile.role === "entreprise") redirect("/portail")

  const [{ count: pendingCount }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("account_status", "pending"),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null),
  ])

  return (
    <DirectionShellClient
      profile={{
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role as AppRole,
      }}
      pendingCount={pendingCount ?? 0}
      unreadCount={unreadCount ?? 0}
    >
      {children}
    </DirectionShellClient>
  )
}
