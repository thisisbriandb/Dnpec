import { redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import { UsersTableClient, type TableDnpecUser } from "@/app/direction/_components/users-table-client"

export const dynamic = "force-dynamic"

export default async function UtilisateursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "super_admin") redirect("/direction/dashboard")

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, account_status, phone, division, last_sign_in_at, created_at")
    .neq("role", "entreprise")
    .order("created_at", { ascending: false })

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary font-mono mb-1">
          Administration · Personnel
        </p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Utilisateurs DNPEC</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez les comptes du personnel DNPEC (super administrateurs, analystes, agents de saisie).
          La suspension d&apos;un compte révoque son accès sans supprimer son historique.
          Réservé au super administrateur.
        </p>
      </div>

      <UsersTableClient
        initialData={(users ?? []) as TableDnpecUser[]}
        currentUserId={user.id}
      />
    </div>
  )
}
