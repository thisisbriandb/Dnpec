import { notFound } from "next/navigation"
import { Building2, Phone, Mail, MapPin, Calendar, Hash, FileText } from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { StatusBadge } from "@/components/ui/status-badge"
import { CompanyActionBar } from "@/app/direction/_components/company-action-bar"
import { CompanyAnnualReportButton } from "@/app/direction/_components/company-annual-report-button"
import { CompanyTargetsTable } from "@/app/direction/_components/company-targets-table"
import { CompanyTags } from "@/app/direction/_components/company-tags"
import { MissingFieldAlert } from "@/app/direction/_components/missing-field-alert"
import { formatNIF, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { TargetRow } from "@/app/direction/_components/company-targets-table"
import * as React from "react"

export const dynamic = "force-dynamic"

type CompanyDetail = {
  id: string; nif: string; rccm: string | null; name: string; size: string; legal_status: string
  contact_email: string; phone: string; address: string | null; creation_year: number | null
  account_status: string; rejection_reason: string | null; created_at: string; validated_at: string | null
  sector: { id: string; name: string } | null
  profile: { id: string; full_name: string; email: string; created_at: string; last_sign_in_at: string | null } | null
  validator: { full_name: string } | null
  creator: { full_name: string } | null
}

export default async function EntrepriseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: company }, { data: targets }, { data: viewerProfile }] = await Promise.all([
    supabase
      .from("companies")
      .select(`
        id, nif, rccm, name, size, legal_status, contact_email, phone,
        address, creation_year, account_status, rejection_reason,
        created_at, validated_at,
        sector:sectors(id, name),
        profile:profiles!profile_id(id, full_name, email, created_at, last_sign_in_at),
        validator:profiles!validated_by(full_name),
        creator:profiles!created_by(full_name)
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("campaign_targets")
      .select(`
        status, created_at,
        campaign:campaigns(id, title, reference_period, status, opens_at, closes_at)
      `)
      .eq("company_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    user
      ? supabase.from("profiles").select("role").eq("id", user.id).single()
      : Promise.resolve({ data: null as { role: string } | null }),
  ])

  if (!company) notFound()

  const canGenerateReports = viewerProfile?.role === "super_admin" || viewerProfile?.role === "analyste"

  const c = company as unknown as CompanyDetail
  const targetRows = (targets ?? []) as unknown as TargetRow[]

  type InfoRow = { icon: React.ElementType; label: string; value: string; warn?: boolean }
  const infoRows = (
    [
      { icon: Hash, label: "NIF", value: formatNIF(c.nif) },
      c.rccm
        ? { icon: FileText, label: "RCCM", value: c.rccm }
        : { icon: FileText, label: "RCCM", value: "Manquant", warn: true },
      { icon: Mail, label: "Email", value: c.contact_email },
      { icon: Phone, label: "Téléphone", value: c.phone },
      c.address ? { icon: MapPin, label: "Adresse", value: c.address } : null,
      c.creation_year ? { icon: Calendar, label: "Année de création", value: String(c.creation_year) } : null,
    ] as (InfoRow | null)[]
  ).filter((r): r is InfoRow => r !== null)

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-title font-semibold text-foreground truncate">{c.name}</h1>
            <StatusBadge status={c.account_status} size="md" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {c.sector?.name ?? "Secteur inconnu"} · NIF {formatNIF(c.nif)}
          </p>
          <div className="mt-2">
            <CompanyTags size={c.size} legalStatus={c.legal_status} sectorName={c.sector?.name} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canGenerateReports && <CompanyAnnualReportButton companyId={c.id} />}
          <CompanyActionBar companyId={c.id} currentStatus={c.account_status} />
        </div>
      </div>

      {/* Rejection reason */}
      {c.account_status === "rejected" && c.rejection_reason && (
        <div className="rounded-md border border-status-bad/30 bg-status-bad-bg px-4 py-3 text-sm text-status-bad-text">
          <strong>Motif du rejet : </strong>{c.rejection_reason}
        </div>
      )}

      {!c.rccm && <MissingFieldAlert message="RCCM manquant — vérifier auprès du greffe" />}

      {/* 2-column grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Informations générales */}
        <div className="rounded-card border border-border bg-surface p-5 shadow-subtle">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Informations générales</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {infoRows.map(({ icon: Icon, label, value, warn }) => (
              <div key={label} className="flex items-center gap-2 text-sm min-w-0">
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground shrink-0">{label} : </span>
                <span className={cn("truncate font-medium", warn && "text-status-warn-text")}>
                  {value}
                </span>
              </div>
            ))}
          </div>
          {c.validated_at && (
            <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
              Validée le {formatDate(c.validated_at)}
              {c.validator?.full_name && ` par ${c.validator.full_name}`}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Créée le {formatDate(c.created_at)}
            {c.creator?.full_name && ` par ${c.creator.full_name}`}
          </p>
        </div>

        {/* Point focal */}
        <div className="rounded-card border border-border bg-surface p-5 shadow-subtle">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Point focal</h2>
          {c.profile ? (
            <dl className="space-y-3">
              <div className="flex items-start gap-2.5">
                <Building2 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">Nom</dt>
                  <dd className="text-sm font-medium">{c.profile.full_name}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="text-sm">{c.profile.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Calendar className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">Compte créé</dt>
                  <dd className="text-sm">{formatDate(c.profile.created_at)}</dd>
                </div>
              </div>
              {c.profile.last_sign_in_at && (
                <div className="flex items-start gap-2.5">
                  <Calendar className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Dernière connexion</dt>
                    <dd className="text-sm">{formatDate(c.profile.last_sign_in_at)}</dd>
                  </div>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun compte utilisateur associé à cette entreprise.
            </p>
          )}
        </div>
      </div>

      {/* Historique campagnes */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-foreground">Historique des campagnes</h2>
        <CompanyTargetsTable data={targetRows} />
      </div>
    </div>
  )
}
