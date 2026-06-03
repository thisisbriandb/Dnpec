import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Plus, Megaphone, CheckCircle2, Clock, Users,
  AlertTriangle, ArrowUpRight, FileText, Inbox,
} from "lucide-react"
import { createClient } from "@/app/lib/supabase/server"
import { cn } from "@/lib/utils"
import {
  CampaignsSidepanelClient,
  type CampaignItem,
  type CampaignStatus,
} from "@/app/direction/_components/campaigns-sidepanel-client"

export const dynamic = "force-dynamic"

export default async function CampagnesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: rows } = await supabase
    .from("campaigns")
    .select(`
      id, title, periodicity, reference_period, status,
      opens_at, closes_at, target_mode,
      sector:sectors!sector_id(name, code),
      campaign_targets(status),
      submissions(status)
    `)
    .order("created_at", { ascending: false })

  const campaigns: CampaignItem[] = (rows ?? []).map((row) => {
    const tgts   = (row.campaign_targets ?? []) as { status: string }[]
    const subs   = (row.submissions      ?? []) as { status: string }[]
    const sector = row.sector as unknown as { name: string; code: string } | null
    return {
      id:               row.id,
      title:            row.title,
      sector:           sector ?? { name: "—", code: "—" },
      periodicity:      row.periodicity,
      reference_period: row.reference_period,
      status:           (row.status as CampaignStatus) ?? "draft",
      opens_at:         row.opens_at  ?? null,
      closes_at:        row.closes_at ?? null,
      target_mode:      row.target_mode ?? "sector",
      targets: {
        total:     tgts.length,
        validated: subs.filter((s) => s.status === "validated").length,
        submitted: subs.filter((s) => s.status === "submitted" || s.status === "correction_requested").length,
      },
    }
  })

  /* ── Agrégats ─────────────────────────────────────────────── */
  const totalCampaigns = campaigns.length
  const activeCount    = campaigns.filter((c) => c.status === "active").length
  const scheduledCount = campaigns.filter((c) => c.status === "scheduled").length
  const totalTargets   = campaigns.reduce((s, c) => s + c.targets.total, 0)
  const totalValidated = campaigns.reduce((s, c) => s + c.targets.validated, 0)
  const pendingCount   = campaigns.reduce((s, c) => s + c.targets.submitted, 0)

  return (
    <div className="flex flex-col">

      {/* ── En-tête ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight text-foreground">
              Campagnes de collecte
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalCampaigns} campagne{totalCampaigns !== 1 ? "s" : ""}
              {activeCount > 0 ? ` · ${activeCount} active${activeCount > 1 ? "s" : ""}` : ""}
            </p>
          </div>
          <Link
            href="/direction/campagnes/nouvelle"
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm shrink-0"
          >
            <Plus className="size-4" />
            Nouvelle campagne
          </Link>
        </div>
      </div>

      {/* ── Section stats ────────────────────────────────────────── */}
      <div
        className="shrink-0 px-6 pt-5 pb-4 space-y-3 border-b border-border"
        style={{ background: "hsl(var(--muted)/0.25)" }}
      >
        {/* Cartes stats */}
        <div className="grid grid-cols-4 gap-3">

          {/* Campagnes totales */}
          <div className="relative rounded-2xl border border-border bg-card p-4 shadow-subtle overflow-hidden flex items-center gap-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-t-2xl" />
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Megaphone className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[28px] font-bold text-foreground leading-none tabular-nums">{totalCampaigns}</p>
              <p className="text-[11px] font-semibold text-muted-foreground mt-1.5">Campagnes</p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                {scheduledCount > 0
                  ? `${scheduledCount} planifiée${scheduledCount > 1 ? "s" : ""}`
                  : "Aucune planifiée"}
              </p>
            </div>
          </div>

          {/* Actives */}
          <div className={cn(
            "relative rounded-2xl border p-4 shadow-subtle overflow-hidden flex items-center gap-4",
            activeCount > 0 ? "border-emerald-200 bg-emerald-50/70" : "border-border bg-card",
          )}>
            {activeCount > 0 && (
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400/60 via-emerald-500 to-emerald-400/60 rounded-t-2xl" />
            )}
            <div className={cn(
              "flex size-11 items-center justify-center rounded-xl shrink-0",
              activeCount > 0 ? "bg-emerald-100" : "bg-muted",
            )}>
              <CheckCircle2 className={cn("size-5", activeCount > 0 ? "text-emerald-600" : "text-muted-foreground/30")} />
            </div>
            <div className="min-w-0">
              <p className={cn("text-[28px] font-bold leading-none tabular-nums", activeCount > 0 ? "text-emerald-700" : "text-muted-foreground/30")}>
                {activeCount}
              </p>
              <p className={cn("text-[11px] font-semibold mt-1.5", activeCount > 0 ? "text-emerald-600" : "text-muted-foreground")}>
                Actives
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">En cours de collecte</p>
            </div>
          </div>

          {/* En attente de validation */}
          <div className={cn(
            "relative rounded-2xl border p-4 shadow-subtle overflow-hidden flex items-center gap-4",
            pendingCount > 0 ? "border-amber-200 bg-amber-50/70" : "border-border bg-card",
          )}>
            {pendingCount > 0 && (
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400/60 via-amber-500 to-amber-400/60 rounded-t-2xl" />
            )}
            <div className={cn(
              "flex size-11 items-center justify-center rounded-xl shrink-0",
              pendingCount > 0 ? "bg-amber-100" : "bg-muted",
            )}>
              <Clock className={cn("size-5", pendingCount > 0 ? "text-amber-600" : "text-muted-foreground/30")} />
            </div>
            <div className="min-w-0">
              <p className={cn("text-[28px] font-bold leading-none tabular-nums", pendingCount > 0 ? "text-amber-700" : "text-muted-foreground/30")}>
                {pendingCount}
              </p>
              <p className={cn("text-[11px] font-semibold mt-1.5", pendingCount > 0 ? "text-amber-600" : "text-muted-foreground")}>
                En attente
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">Soumissions à valider</p>
            </div>
          </div>

          {/* Entreprises ciblées */}
          <div className="relative rounded-2xl border border-border bg-card p-4 shadow-subtle overflow-hidden flex items-center gap-4">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-400/60 via-blue-500 to-blue-400/60 rounded-t-2xl" />
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 shrink-0">
              <Users className="size-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[28px] font-bold text-foreground leading-none tabular-nums">{totalTargets}</p>
              <p className="text-[11px] font-semibold text-muted-foreground mt-1.5">Entreprises</p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                {totalValidated} validée{totalValidated !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Barre alerte + actions rapides */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Alerte soumissions */}
          {pendingCount > 0 ? (
            <Link
              href="/direction/soumissions"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-colors shadow-subtle"
            >
              <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
              <span>
                {pendingCount} soumission{pendingCount > 1 ? "s" : ""} en attente de validation
              </span>
              <ArrowUpRight className="size-3.5 shrink-0" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/50 italic">
              <CheckCircle2 className="size-3 text-emerald-400" />
              Aucune soumission en attente
            </span>
          )}

          {/* Actions rapides */}
          <div className="ml-auto flex items-center gap-2">
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mr-1 hidden sm:block">
              Actions rapides
            </p>
            <Link
              href="/direction/formulaires"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-subtle"
            >
              <FileText className="size-3.5" />
              Formulaires
            </Link>
            <Link
              href="/direction/soumissions"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors shadow-subtle",
                pendingCount > 0
                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Inbox className="size-3.5" />
              Toutes les soumissions
              {pendingCount > 0 && (
                <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white tabular-nums">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Sidepanel ───────────────────────────────────────────── */}
      <CampaignsSidepanelClient campaigns={campaigns} />
    </div>
  )
}
