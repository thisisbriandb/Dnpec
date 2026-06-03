import { redirect } from "next/navigation"
import { Lock, Building2, User } from "lucide-react"
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

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground/70">
        {label}
      </p>
      <p className="text-[13px] font-medium text-foreground">{value || "—"}</p>
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

  const companyInitials = company.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <div className="p-6 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-display font-semibold text-foreground">Mon profil</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Informations de votre compte et de votre entreprise.
        </p>
      </div>

      {/* Company identity card */}
      <div className="relative rounded-2xl border border-border bg-card shadow-subtle overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(30,58,95,0.05) 0%, transparent 55%)" }}
        />
        <div className="relative px-6 py-5 flex items-center gap-4">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-white font-bold text-lg shadow-sm"
            style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #2563eb 100%)" }}
          >
            {companyInitials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-semibold text-foreground leading-tight">{company.name}</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">{sector} · NIF {company.nif}</p>
          </div>
          <StatusBadge status={company.account_status} />
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Informations entreprise — lecture seule */}
        <section className="lg:col-span-3 bg-card rounded-2xl border border-border shadow-subtle overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-muted/20">
            <div className="flex items-center gap-2">
              <Building2 className="size-3.5 text-muted-foreground" />
              <h3 className="text-[13px] font-semibold text-foreground">Informations entreprise</h3>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/55">
              <Lock className="size-3" />
              <span>Lecture seule</span>
            </div>
          </div>

          <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <InfoField label="Raison sociale"   value={company.name} />
            <InfoField label="NIF"              value={company.nif} />
            <InfoField label="RCCM"             value={company.rccm} />
            <InfoField label="Secteur"          value={sector} />
            <InfoField label="Taille"           value={SIZE_LABELS[company.size] ?? company.size} />
            <InfoField label="Forme juridique"  value={LEGAL_LABELS[company.legal_status] ?? company.legal_status} />
            <InfoField label="Date de création" value={formatDate(company.date_creation ?? null)} />
            <InfoField label="Région"           value={company.region} />
            <InfoField label="Commune"          value={company.commune} />
            <InfoField label="Adresse"          value={company.address} />
            <InfoField label="Enregistrée le"   value={formatDate(company.created_at)} />
          </div>

          <div className="px-5 pb-4 border-t border-border/40 pt-3">
            <p className="text-[11px] text-muted-foreground/55 flex items-center gap-1.5">
              <Lock className="size-3 shrink-0" />
              Ces informations sont gérées par la DNPEC. Contactez-nous pour les modifier.
            </p>
          </div>
        </section>

        {/* Point focal — éditable */}
        <section className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-subtle overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20">
            <div className="flex items-center gap-2 mb-0.5">
              <User className="size-3.5 text-muted-foreground" />
              <h3 className="text-[13px] font-semibold text-foreground">Point focal</h3>
            </div>
            <p className="text-[12px] text-muted-foreground">
              {profile.full_name} · Coordonnées modifiables
            </p>
          </div>
          <div className="px-5 py-5">
            <ContactForm phone={profile.phone ?? null} email={profile.email} />
          </div>
        </section>

      </div>
    </div>
  )
}
