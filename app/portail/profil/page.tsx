import { redirect } from "next/navigation"
import { Lock } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatDate } from "@/lib/format"
import { ContactForm } from "./_components/contact-form"

export const dynamic = "force-dynamic"

const SIZE_LABELS: Record<string, string> = {
  tpe:              "TPE — Très Petite Entreprise",
  pme:              "PME — Petite et Moyenne Entreprise",
  grande_entreprise:"Grande Entreprise",
}

const LEGAL_LABELS: Record<string, string> = {
  sa:     "SA — Société Anonyme",
  sarl:   "SARL — Société à Resp. Limitée",
  suarl:  "SUARL — Société Unipersonnelle",
  gie:    "GIE — Groupement d'Intérêt Économique",
  public: "Entreprise Publique",
  autre:  "Autre",
}

function ReadRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-[12px] text-muted-foreground shrink-0">{label}</span>
      <span className="text-[12.5px] font-medium text-foreground text-right">{value || "—"}</span>
    </div>
  )
}

export default async function PortailProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [profileRes, companyRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .single(),
    supabase
      .from("companies")
      .select("name, nif, rccm, legal_status, size, account_status, created_at, date_creation, region, commune, address, sector:sectors(name)")
      .eq("profile_id", user.id)
      .single(),
  ])

  if (!profileRes.data || !companyRes.data) redirect("/portail")

  const profile = profileRes.data
  const company = companyRes.data
  const sector  = (company.sector as unknown as { name: string } | null)?.name ?? "—"

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-display font-semibold text-foreground">Mon profil</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Informations de votre compte et de votre entreprise.
        </p>
      </div>

      {/* Informations entreprise — lecture seule */}
      <section className="bg-white rounded-2xl border border-border shadow-subtle overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2">
            <Lock className="size-3.5 text-muted-foreground" />
            <h2 className="text-[13px] font-semibold text-foreground">Informations entreprise</h2>
          </div>
          <StatusBadge status={company.account_status} size="sm" />
        </div>

        <div className="px-5 py-2">
          <ReadRow label="Raison sociale"   value={company.name} />
          <ReadRow label="NIF"              value={company.nif} />
          <ReadRow label="RCCM"             value={company.rccm} />
          <ReadRow label="Secteur"          value={sector} />
          <ReadRow label="Taille"           value={SIZE_LABELS[company.size] ?? company.size} />
          <ReadRow label="Forme juridique"  value={LEGAL_LABELS[company.legal_status] ?? company.legal_status} />
          <ReadRow label="Date de création" value={formatDate(company.date_creation ?? null)} />
          <ReadRow label="Région"           value={company.region} />
          <ReadRow label="Commune"          value={company.commune} />
          <ReadRow label="Adresse"          value={company.address} />
          <ReadRow label="Enregistrée le"   value={formatDate(company.created_at)} />
        </div>

        <p className="px-5 pb-3 text-[11px] text-muted-foreground/70 flex items-center gap-1">
          <Lock className="size-3" />
          Ces informations sont gérées par la DNPEC. Contactez-nous pour les modifier.
        </p>
      </section>

      {/* Contact — éditable */}
      <section className="bg-white rounded-2xl border border-border shadow-subtle overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20">
          <h2 className="text-[13px] font-semibold text-foreground">Point focal</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {profile.full_name} · Coordonnées modifiables
          </p>
        </div>
        <div className="px-5 py-5">
          <ContactForm phone={profile.phone ?? null} email={profile.email} />
        </div>
      </section>
    </div>
  )
}
