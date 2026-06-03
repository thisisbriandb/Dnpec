import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import { PortailShellClient } from "./_components/portail-shell-client"
import { PendingScreen }   from "./_components/pending-screen"
import { RejectedScreen }  from "./_components/rejected-screen"
import { SuspendedScreen } from "./_components/suspended-screen"

export const dynamic = "force-dynamic"

export default async function PortailLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")
  if (profile.role !== "entreprise") redirect("/direction/dashboard")

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, account_status, rejection_reason, created_at")
    .eq("profile_id", user.id)
    .single()

  // Inscription incomplète (OTP validé mais formulaire non terminé)
  if (!company) redirect("/inscription")

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null)

  const profileData  = { full_name: profile.full_name, email: profile.email }
  const companyShell = { name: company.name }

  // Statut non validé → afficher l'écran de statut à la place du contenu
  if (company.account_status !== "validated") {
    return (
      <PortailShellClient
        profile={profileData}
        company={companyShell}
        unreadCount={0}
      >
        {company.account_status === "pending" && (
          <PendingScreen
            companyName={company.name}
            submittedAt={company.created_at}
          />
        )}
        {company.account_status === "rejected" && (
          <RejectedScreen
            companyName={company.name}
            rejectionReason={company.rejection_reason ?? null}
          />
        )}
        {company.account_status === "suspended" && (
          <SuspendedScreen companyName={company.name} />
        )}
      </PortailShellClient>
    )
  }

  return (
    <PortailShellClient
      profile={profileData}
      company={companyShell}
      unreadCount={unreadCount ?? 0}
    >
      {children}
    </PortailShellClient>
  )
}
