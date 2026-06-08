"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import Link from "next/link"
import {
  ArrowLeft, Send, CircleDot, ArchiveIcon, Ban, Play,
  Users, Clock, CheckCircle2, XCircle, AlertCircle, FileText,
  ChevronUp, ChevronDown, Download, Search, X, Eye, CalendarDays, Check,
  MessageSquare,
} from "lucide-react"
import { updateCampaignStatus } from "@/app/actions/campaigns"
import { validateSubmission, rejectSubmission, requestCorrection } from "@/app/actions/submissions"
import { cn } from "@/lib/utils"

/* ── Types ────────────────────────────────────────────────────────── */
type FormField = {
  key: string
  label: string
  type: string
  required: boolean
  unit?: string | null
  options?: unknown[]
}
type FormSection  = { key: string; title: string; fields: FormField[] }
type FormSchema   = { sections: FormSection[] }
type CampaignStatus    = "draft" | "scheduled" | "active" | "closed" | "archived"
type SubmissionStatus  = "submitted" | "validated" | "rejected" | "correction_requested"

type Company = {
  id: string; name: string; nif: string; rccm: string | null
  size: string; legal_status: string; contact_email: string; phone: string
  address: string | null; sigle: string | null; nom_dg: string | null
  region: string | null; commune: string | null; date_creation: string | null
  responsable_dnpec: string | null; activite_nace: string | null
  capital_social: number | null; creation_year: number | null
  sector: { name: string; code: string } | null
}
export type Submission = {
  id: string; status: SubmissionStatus; submitted_at: string | null
  validated_at: string | null; rejection_comment: string | null
  answers: Record<string, unknown>; completion_rate: number
  company: Company
}
export type Campaign = {
  id: string; title: string; reference_period: string; periodicity: string
  status: CampaignStatus; opens_at: string; closes_at: string
  target_mode: string; sent_at: string | null; closed_at: string | null; created_at: string
  sector: { id: string; name: string; code: string }
  form_template: { id: string; title: string; description: string | null; schema: FormSchema }
}

/* ── Static config ────────────────────────────────────────────────── */
const CAMPAIGN_CFG: Record<CampaignStatus, { label: string; dot: string; badge: string }> = {
  draft:     { label: "Brouillon", dot: "bg-gray-300",    badge: "bg-gray-50   text-gray-500   border-gray-200"    },
  scheduled: { label: "Planifiée", dot: "bg-blue-400",    badge: "bg-blue-50   text-blue-700   border-blue-200"    },
  active:    { label: "Active",    dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed:    { label: "Clôturée", dot: "bg-slate-400",   badge: "bg-slate-50  text-slate-600  border-slate-200"   },
  archived:  { label: "Archivée", dot: "bg-gray-200",    badge: "bg-gray-50   text-gray-400   border-gray-100"    },
}

const SUB_CFG: Record<SubmissionStatus, { label: string; dot: string; badge: string }> = {
  submitted:            { label: "Soumise",          dot: "bg-blue-400",   badge: "bg-blue-50  text-blue-700  border-blue-200"   },
  validated:            { label: "Validée",          dot: "bg-emerald-500",badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected:             { label: "Rejetée",          dot: "bg-red-500",    badge: "bg-red-50   text-red-700   border-red-200"    },
  correction_requested: { label: "Correction dem.",  dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-700 border-amber-200"  },
}

const PERIODICITY: Record<string, string> = {
  monthly: "Mensuelle", quarterly: "Trimestrielle", annual: "Annuelle", one_off: "Ponctuelle",
}
const SIZE_LBL: Record<string, string> = {
  tpe: "TPE", pme: "PME", grande_entreprise: "Grande entreprise",
}
const LEGAL_LBL: Record<string, string> = {
  sa: "S.A.", sarl: "S.A.R.L.", suarl: "S.U.A.R.L.", gie: "G.I.E.", public: "Public", autre: "Autre",
}

/* ── Helpers ──────────────────────────────────────────────────────── */
function fmtDate(s: string | null) {
  if (!s) return "—"
  return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
}
function fmtDateTime(s: string | null) {
  if (!s) return "—"
  return new Date(s).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}
function daysUntil(s: string) {
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86_400_000)
}
function normalizeOption(raw: unknown): string {
  if (typeof raw === "string") return raw
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>
    return String(o.label ?? o.name ?? o.text ?? o.value ?? o.id ?? raw)
  }
  return String(raw)
}
function formatAnswer(value: unknown, field: FormField): string {
  if (value === null || value === undefined || value === "") return "—"
  if (field.type === "checkbox") return value === "true" || value === true ? "Oui" : "Non"
  if (field.type === "date") return fmtDate(value as string)
  if (field.type === "multi_select") {
    const arr = Array.isArray(value) ? value : [value]
    return arr.map((v) => normalizeOption(v)).join(", ") || "—"
  }
  if (field.type === "single_select") return normalizeOption(value)
  if (field.type === "data_table") return "[Tableau]"
  if (field.type === "file") return "[Fichier joint]"
  return String(value)
}
function exportCSV(rows: Submission[], fields: FormField[], name: string) {
  const hFixed = ["Entreprise", "NIF", "Statut", "Date soumission", "Taux (%)"]
  const hDyn   = fields.map((f) => f.label)
  const header = [...hFixed, ...hDyn]
  const body   = rows.map((sub) => {
    return [
      sub.company.name,
      sub.company.nif,
      SUB_CFG[sub.status]?.label ?? sub.status,
      fmtDateTime(sub.submitted_at),
      String(Math.round(sub.completion_rate)),
      ...fields.map((f) => formatAnswer(sub.answers[f.key], f)),
    ]
  })
  const csv = [header, ...body]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}

/* ══════════════════════════════════════════════════════════════════ */
/*  MAIN CLIENT COMPONENT                                            */
/* ══════════════════════════════════════════════════════════════════ */
export function CampaignDetailClient({
  campaign,
  targets,
  submissions,
}: {
  campaign: Campaign
  targets: { status: string }[]
  submissions: Submission[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [search,      setSearch]      = React.useState("")
  const [statusFilter,setStatusFilter]= React.useState<"all" | SubmissionStatus>("all")
  const [sortCol,     setSortCol]     = React.useState("submitted_at")
  const [sortDir,     setSortDir]     = React.useState<"asc" | "desc">("desc")
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [aside,       setAside]       = React.useState<Submission | null>(null)
  const [asideTab,    setAsideTab]    = React.useState<"answers" | "company">("answers")

  const allCheckRef = React.useRef<HTMLInputElement>(null)

  /* Flatten form fields */
  const formFields = React.useMemo(
    () => (campaign.form_template.schema?.sections ?? []).flatMap((s) => s.fields),
    [campaign.form_template.schema],
  )

  /* Submission counts (source de vérité) */
  const subCounts = React.useMemo(() => {
    const m: Record<string, number> = {}
    submissions.forEach((s) => { m[s.status] = (m[s.status] ?? 0) + 1 })
    return m
  }, [submissions])

  /* Filter + sort */
  const filtered = React.useMemo(() => {
    const q = search.toLowerCase()
    let res = submissions.filter((s) => {
      const ok1 = !q || s.company.name.toLowerCase().includes(q) || s.company.nif.toLowerCase().includes(q)
      const ok2 = statusFilter === "all" || s.status === statusFilter
      return ok1 && ok2
    })
    res = [...res].sort((a, b) => {
      let av: string | number = 0
      let bv: string | number = 0
      if (sortCol === "company")       { av = a.company.name; bv = b.company.name }
      else if (sortCol === "status")   { av = a.status;       bv = b.status }
      else if (sortCol === "submitted_at") {
        av = a.submitted_at ?? ""; bv = b.submitted_at ?? ""
      } else if (sortCol === "rate") {
        av = a.completion_rate
        bv = b.completion_rate
      } else {
        const va = a.answers?.[sortCol]
        const vb = b.answers?.[sortCol]
        av = va ? String(va) : ""; bv = vb ? String(vb) : ""
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === "asc" ? cmp : -cmp
    })
    return res
  }, [submissions, search, statusFilter, sortCol, sortDir])

  /* Sync indeterminate state on checkbox */
  React.useEffect(() => {
    if (!allCheckRef.current) return
    allCheckRef.current.indeterminate =
      selectedIds.size > 0 && selectedIds.size < filtered.length
  }, [selectedIds, filtered.length])

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortCol(col); setSortDir("asc") }
  }

  function changeStatus(status: CampaignStatus) {
    startTransition(async () => {
      const res = await updateCampaignStatus(campaign.id, status)
      if ("error" in res) toast.error(res.error)
      else { toast.success(`Campagne ${CAMPAIGN_CFG[status].label.toLowerCase()}`); router.refresh() }
    })
  }

  const cfg          = CAMPAIGN_CFG[campaign.status]
  const total        = targets.length
  const validated    = subCounts.validated             ?? 0
  const submitted_t  = (subCounts.submitted            ?? 0) + (subCounts.correction_requested ?? 0)
  const rejected_t   = subCounts.rejected              ?? 0
  const inProgress   = 0
  const responded    = validated + submitted_t
  const waiting      = Math.max(0, total - responded - rejected_t)
  const rate         = total > 0 ? Math.round((responded / total) * 100) : 0
  const days         = daysUntil(campaign.closes_at)
  const isOpen       = campaign.status === "active"

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="shrink-0 px-6 py-4 border-b border-border bg-card">
        <div className="flex items-start gap-4">
          <Link
            href="/direction/campagnes"
            className="shrink-0 flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors mt-0.5"
          >
            <ArrowLeft className="size-4 text-muted-foreground" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">
                {campaign.sector.code}
              </span>
              <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border", cfg.badge)}>
                <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                {cfg.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {PERIODICITY[campaign.periodicity] ?? campaign.periodicity} · {campaign.reference_period}
              </span>
              {isOpen && days <= 7 && (
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", days <= 3 ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-amber-50 text-amber-700")}>
                  J‑{days}
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{campaign.title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {campaign.status === "draft" && (
              <>
                <ActionBtn label="Planifier"       icon={<Play className="size-3.5" />}        variant="secondary" onClick={() => changeStatus("scheduled")} disabled={isPending} />
                <ActionBtn label="Publier"          icon={<Send className="size-3.5" />}        variant="publish"   onClick={() => changeStatus("active")}    disabled={isPending} />
              </>
            )}
            {campaign.status === "scheduled" && (
              <>
                <ActionBtn label="Brouillon"        icon={<Ban className="size-3.5" />}         variant="secondary" onClick={() => changeStatus("draft")}     disabled={isPending} />
                <ActionBtn label="Publier maint."   icon={<Send className="size-3.5" />}        variant="publish"   onClick={() => changeStatus("active")}    disabled={isPending} />
              </>
            )}
            {campaign.status === "active" && (
              <ActionBtn label="Clôturer"           icon={<CircleDot className="size-3.5" />}   variant="danger"    onClick={() => changeStatus("closed")}    disabled={isPending} />
            )}
            {campaign.status === "closed" && (
              <ActionBtn label="Archiver"           icon={<ArchiveIcon className="size-3.5" />} variant="secondary" onClick={() => changeStatus("archived")}  disabled={isPending} />
            )}
          </div>
        </div>
      </div>

      {/* ── Stats section ───────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-5 pb-4 space-y-3 border-b border-border" style={{ background: "hsl(var(--muted)/0.25)" }}>

        {/* 6 stat cards */}
        <div className="grid grid-cols-6 gap-3">
          <StatCard value={total}       label="Cibles"       sub={campaign.target_mode === "sector" ? "Secteur entier" : "Sélection"} icon={<Users className="size-5 text-primary" />}          iconBg="bg-primary/10"   accent="from-primary/60 via-primary to-primary/60"           vCls="text-foreground" />
          <StatCard value={waiting}     label="En attente"   sub="Pas encore soumis" icon={<Clock className="size-5 text-gray-400" />}                                                         iconBg="bg-muted"        accent="from-gray-300 via-gray-400 to-gray-300"               vCls={waiting > 0 ? "text-foreground" : "text-muted-foreground/30"} />
          <StatCard value={inProgress}  label="En cours"     sub="Brouillon en saisie" icon={<AlertCircle className="size-5 text-violet-600" />}                                               iconBg="bg-violet-50"    accent="from-violet-400/60 via-violet-500 to-violet-400/60"   vCls={inProgress > 0 ? "text-violet-700" : "text-muted-foreground/30"} />
          <StatCard value={submitted_t} label="Soumises"     sub="En attente validation" icon={<FileText className="size-5 text-blue-600" />}                                                  iconBg="bg-blue-50"      accent="from-blue-400/60 via-blue-500 to-blue-400/60"         vCls={submitted_t > 0 ? "text-blue-700" : "text-muted-foreground/30"} />
          <StatCard value={validated}   label="Validées"     sub={`${rate}% global`}  icon={<CheckCircle2 className="size-5 text-emerald-600" />}                                             iconBg="bg-emerald-50"   accent="from-emerald-400/60 via-emerald-500 to-emerald-400/60" vCls={validated > 0 ? "text-emerald-700" : "text-muted-foreground/30"} hl={total > 0 && validated === total} />
          <StatCard value={rejected_t}  label="Rejetées"     sub="Correction requise" icon={<XCircle className="size-5 text-red-500" />}                                                      iconBg="bg-red-50"       accent="from-red-400/60 via-red-500 to-red-400/60"            vCls={rejected_t > 0 ? "text-red-600" : "text-muted-foreground/30"} />
        </div>

        {/* Info bar */}
        <div className="grid grid-cols-4 gap-3">
          <InfoCard icon={<CalendarDays className="size-4 text-muted-foreground/60" />} label="Ouverture" value={fmtDate(campaign.opens_at)} />
          <InfoCard
            icon={<Clock className={cn("size-4", isOpen && days <= 7 ? "text-amber-500" : "text-muted-foreground/60")} />}
            label={`Clôture${isOpen && days > 0 ? ` · J-${days}` : ""}`}
            value={fmtDate(campaign.closes_at)}
            urgent={isOpen && days <= 7}
          />
          <InfoCard icon={<FileText className="size-4 text-muted-foreground/60" />} label="Formulaire" value={campaign.form_template.title} />
          <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-subtle">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Progression</p>
              <span className="text-sm font-bold tabular-nums text-foreground">{rate}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${rate}%`, backgroundColor: rate >= 80 ? "#22c55e" : rate >= 50 ? "#3b82f6" : "#f59e0b" }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-1.5">{responded} / {total} entreprises</p>
          </div>
        </div>
      </div>

      {/* ── Submissions table section ────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="rounded-2xl border border-border bg-card shadow-subtle overflow-hidden">

          {/* Table toolbar */}
          <div className="px-5 py-4 border-b border-border flex items-center gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Soumissions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filtered.length} soumission{filtered.length !== 1 ? "s" : ""}
                {selectedIds.size > 0 && ` · ${selectedIds.size} sélectionnée${selectedIds.size > 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 w-52">
                <Search className="size-3.5 text-muted-foreground/50 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher une entreprise…"
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="text-muted-foreground/50 hover:text-foreground">
                    <X className="size-3" />
                  </button>
                )}
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | SubmissionStatus)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground outline-none cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="submitted">Soumises</option>
                <option value="validated">Validées</option>
                <option value="rejected">Rejetées</option>
                <option value="correction_requested">Correction dem.</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  const toExport = selectedIds.size > 0
                    ? filtered.filter((s) => selectedIds.has(s.id))
                    : filtered
                  exportCSV(toExport, formFields, `campagne-${campaign.reference_period}-${Date.now()}.csv`)
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors shadow-subtle"
              >
                <Download className="size-3.5" />
                {selectedIds.size > 0 ? `Exporter (${selectedIds.size})` : "Exporter tout"}
              </button>
            </div>
          </div>

          {/* Table — thead always visible */}
          <div className="overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-muted/70 border-b border-border backdrop-blur-sm">
                <tr>
                  <th className="w-10 px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      ref={allCheckRef}
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={() => {
                        if (selectedIds.size === filtered.length) setSelectedIds(new Set())
                        else setSelectedIds(new Set(filtered.map((s) => s.id)))
                      }}
                      className="rounded border-input cursor-pointer"
                      disabled={filtered.length === 0}
                    />
                  </th>
                  <SortTh label="Entreprise"  col="company"      sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} sticky />
                  {formFields.map((f) => (
                    <SortTh key={f.key} label={f.label} col={f.key} sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  ))}
                  <SortTh label="Statut"      col="status"       sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <SortTh label="Date soumis" col="submitted_at" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <SortTh label="Taux"        col="rate"         sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-3 py-3 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Ouvrir
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={6 + formFields.length} className="py-16 text-center px-6">
                      <FileText className="size-10 text-muted-foreground/15 mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">Aucune soumission</p>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Les entreprises ciblées n'ont pas encore soumis de données pour cette campagne.
                      </p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6 + formFields.length} className="py-12 text-center px-6">
                      <Search className="size-8 text-muted-foreground/15 mx-auto mb-3" />
                      <p className="text-xs text-muted-foreground mb-2">Aucun résultat pour ces filtres</p>
                      <button
                        type="button"
                        onClick={() => { setSearch(""); setStatusFilter("all") }}
                        className="text-xs text-primary hover:underline"
                      >
                        Réinitialiser les filtres
                      </button>
                    </td>
                  </tr>
                ) : null}
                {filtered.map((sub) => {
                    const answers = sub.answers
                    const rate_s  = sub.completion_rate
                    const sc      = SUB_CFG[sub.status]
                    const isSel   = selectedIds.has(sub.id)
                    const isAside = aside?.id === sub.id

                    return (
                      <tr
                        key={sub.id}
                        className={cn(
                          "transition-colors group",
                          isAside ? "bg-primary/5" : isSel ? "bg-accent" : "hover:bg-muted/20",
                        )}
                      >
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => setSelectedIds((prev) => {
                              const n = new Set(prev)
                              n.has(sub.id) ? n.delete(sub.id) : n.add(sub.id)
                              return n
                            })}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-input cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2.5 min-w-[170px]">
                          <p className="font-medium text-foreground text-xs truncate max-w-[200px]">{sub.company.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{sub.company.nif}</p>
                        </td>
                        {formFields.map((f) => (
                          <td key={f.key} className="px-3 py-2.5 min-w-[110px] max-w-[180px]">
                            <span className="text-xs text-foreground/75 block truncate">
                              {formatAnswer(answers[f.key], f)}
                            </span>
                          </td>
                        ))}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                            sc?.badge ?? "bg-gray-50 text-gray-500 border-gray-200",
                          )}>
                            <span className={cn("size-1.5 rounded-full shrink-0", sc?.dot ?? "bg-gray-300")} />
                            {sc?.label ?? sub.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                          {fmtDate(sub.submitted_at)}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${rate_s}%`,
                                  backgroundColor: rate_s >= 80 ? "#22c55e" : rate_s >= 50 ? "#3b82f6" : "#f59e0b",
                                }}
                              />
                            </div>
                            <span className="text-[10px] tabular-nums text-muted-foreground">{Math.round(rate_s)}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => { setAside(sub); setAsideTab("answers") }}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border transition-all",
                              isAside
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-subtle",
                            )}
                          >
                            <Eye className="size-3.5" />
                            Ouvrir
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Aside panel ─────────────────────────────────────────── */}
      {aside && (
        <AsidePanel
          submission={aside}
          sections={campaign.form_template.schema?.sections ?? []}
          tab={asideTab}
          onTabChange={setAsideTab}
          onClose={() => setAside(null)}
          onSubmissionUpdate={(id, update) => {
            setAside((prev) => prev && prev.id === id ? { ...prev, ...update } : prev)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

/* ── Stat card ───────────────────────────────────────────────────── */
function StatCard({
  value, label, sub, icon, iconBg, accent, vCls, hl,
}: {
  value: number; label: string; sub?: string
  icon: React.ReactNode; iconBg: string; accent: string; vCls: string; hl?: boolean
}) {
  return (
    <div className={cn(
      "relative rounded-2xl border p-4 shadow-subtle overflow-hidden flex items-center gap-3",
      hl ? "border-emerald-200 bg-emerald-50/40" : "border-border bg-card",
    )}>
      <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r rounded-t-2xl", accent)} />
      <div className={cn("flex size-10 items-center justify-center rounded-xl shrink-0", iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={cn("text-[24px] font-bold leading-none tabular-nums", vCls)}>{value}</p>
        <p className="text-[10px] font-semibold text-muted-foreground mt-1.5 leading-tight">{label}</p>
        {sub && <p className="text-[9px] text-muted-foreground/50 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

/* ── Info card ───────────────────────────────────────────────────── */
function InfoCard({
  icon, label, value, urgent,
}: { icon: React.ReactNode; label: string; value: string; urgent?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border px-4 py-3 flex items-center gap-3 shadow-subtle",
      urgent ? "border-amber-200 bg-amber-50/60" : "border-border bg-card",
    )}>
      <div className={cn("flex size-8 items-center justify-center rounded-lg shrink-0", urgent ? "bg-amber-100" : "bg-muted")}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={cn("text-[10px] font-semibold uppercase tracking-wider", urgent ? "text-amber-600" : "text-muted-foreground")}>{label}</p>
        <p className={cn("text-sm font-semibold truncate", urgent ? "text-amber-700" : "text-foreground")}>{value}</p>
      </div>
    </div>
  )
}

/* ── Sortable table header ───────────────────────────────────────── */
function SortTh({
  label, col, sortCol, sortDir, onSort, sticky,
}: {
  label: string; col: string; sortCol: string; sortDir: "asc" | "desc"
  onSort: (c: string) => void; sticky?: boolean
}) {
  const active = sortCol === col
  return (
    <th
      onClick={() => onSort(col)}
      className={cn(
        "px-3 py-3 text-left cursor-pointer select-none whitespace-nowrap",
        "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
        active && "text-foreground",
        sticky && "min-w-[170px]",
      )}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={cn("transition-colors", active ? "text-foreground" : "text-muted-foreground/25")}>
          {active
            ? sortDir === "asc"
              ? <ChevronUp className="size-3" />
              : <ChevronDown className="size-3" />
            : <ChevronDown className="size-3" />}
        </span>
      </div>
    </th>
  )
}

/* ── Action button ───────────────────────────────────────────────── */
function ActionBtn({
  label, icon, variant, onClick, disabled,
}: { label: string; icon: React.ReactNode; variant: "secondary" | "danger" | "publish"; onClick: () => void; disabled?: boolean }) {
  const cls = {
    secondary: "bg-muted text-foreground hover:bg-muted/70 border border-border",
    danger:    "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200",
    publish:   "bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-200",
  }[variant]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors shadow-subtle disabled:opacity-50", cls)}
    >
      {icon}{label}
    </button>
  )
}

/* ── Aside panel ─────────────────────────────────────────────────── */
function AsidePanel({
  submission, sections, tab, onTabChange, onClose, onSubmissionUpdate,
}: {
  submission: Submission
  sections: FormSection[]
  tab: "answers" | "company"
  onTabChange: (t: "answers" | "company") => void
  onClose: () => void
  onSubmissionUpdate: (id: string, update: Partial<Submission>) => void
}) {
  const ans  = submission.answers
  const sc   = SUB_CFG[submission.status]
  const co   = submission.company

  const [activeAction, setActiveAction] = React.useState<"correction" | "reject" | null>(null)
  const [comment, setComment]           = React.useState("")
  const [actionError, setActionError]   = React.useState<string | null>(null)
  const [isPending, startTransition]    = React.useTransition()

  const canAct = submission.status === "submitted" || submission.status === "correction_requested"

  function handleValidate() {
    setActionError(null)
    startTransition(async () => {
      const res = await validateSubmission(submission.id)
      if (res && "error" in res) { setActionError(res.error); return }
      onSubmissionUpdate(submission.id, { status: "validated", rejection_comment: null })
    })
  }

  function handleCommentAction() {
    setActionError(null)
    startTransition(async () => {
      const res = activeAction === "correction"
        ? await requestCorrection(submission.id, comment)
        : await rejectSubmission(submission.id, comment)
      if (res && "error" in res) { setActionError(res.error); return }
      const newStatus = activeAction === "correction" ? "correction_requested" : "rejected"
      onSubmissionUpdate(submission.id, { status: newStatus as SubmissionStatus, rejection_comment: comment })
      setActiveAction(null)
      setComment("")
    })
  }

  return (
    <div
      className="fixed inset-y-0 right-0 z-40 flex flex-col bg-card border-l border-border shadow-2xl"
      style={{ width: 440, top: 56 }}
    >
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-border space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-muted-foreground mb-0.5">{co.nif}</p>
            <h3 className="text-base font-semibold text-foreground leading-snug">{co.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", sc?.badge)}>
            <span className={cn("size-1.5 rounded-full shrink-0", sc?.dot)} />
            {sc?.label}
          </span>
          <span className="text-[10px] text-muted-foreground">Taux : <strong>{Math.round(submission.completion_rate)}%</strong></span>
          <span className="text-[10px] text-muted-foreground">{fmtDateTime(submission.submitted_at)}</span>
        </div>
        {submission.rejection_comment && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-0.5">Motif de rejet</p>
            <p className="text-xs text-red-700">{submission.rejection_comment}</p>
          </div>
        )}
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {(["answers", "company"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onTabChange(k)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all",
                tab === k
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60",
              )}
            >
              {k === "answers" ? "Réponses formulaire" : "Détails entreprise"}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth: "thin" }}>

        {tab === "answers" && (
          sections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun champ configuré.</p>
          ) : sections.map((section, si) => (
            <div key={section.key} className="rounded-xl border border-border bg-background overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 border-b border-border">
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-bold border border-primary/15">
                  {si + 1}
                </span>
                <h4 className="text-xs font-semibold text-foreground">{section.title}</h4>
              </div>
              <div className="divide-y divide-border/50">
                {section.fields.map((field) => {
                  const val     = ans[field.key]
                  const isEmpty = val === null || val === undefined || val === ""
                  return (
                    <div key={field.key} className="px-4 py-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{field.label}</p>
                        {field.required && <span className="text-[9px] text-red-400 font-bold">REQ.</span>}
                        {field.unit && (
                          <span className="text-[9px] font-mono bg-muted border border-border px-1 rounded">{field.unit}</span>
                        )}
                      </div>
                      {isEmpty ? (
                        <p className="text-xs text-muted-foreground/40 italic">Non renseigné</p>
                      ) : field.type === "multi_select" ? (
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(val) ? val : [val]).map((v, i) => (
                            <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 font-medium">
                              {normalizeOption(v)}
                            </span>
                          ))}
                        </div>
                      ) : field.type === "checkbox" ? (
                        <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", val === "true" || val === true ? "text-emerald-600" : "text-muted-foreground")}>
                          {val === "true" || val === true
                            ? <><Check className="size-3.5" />Oui</>
                            : <><X className="size-3.5" />Non</>}
                        </span>
                      ) : field.type === "long_text" ? (
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{String(val)}</p>
                      ) : (
                        <p className="text-sm font-medium text-foreground">
                          {formatAnswer(val, field)}
                          {field.unit && <span className="ml-1 text-xs text-muted-foreground font-mono">{field.unit}</span>}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {tab === "company" && (
          <div className="space-y-4">
            <CoSection title="Identité">
              <CoField label="Raison sociale"   value={co.name} />
              <CoField label="Sigle"            value={co.sigle} />
              <CoField label="NIF"              value={co.nif}          mono />
              <CoField label="RCCM"             value={co.rccm}         mono />
              <CoField label="Statut juridique" value={LEGAL_LBL[co.legal_status] ?? co.legal_status} />
              <CoField label="Taille"           value={SIZE_LBL[co.size] ?? co.size} />
              <CoField label="Secteur"          value={co.sector ? `${co.sector.name} (${co.sector.code})` : null} />
            </CoSection>
            <CoSection title="Contact">
              <CoField label="Email"     value={co.contact_email} />
              <CoField label="Téléphone" value={co.phone} />
              <CoField label="Adresse"   value={co.address} />
              <CoField label="Région"    value={co.region} />
              <CoField label="Commune"   value={co.commune} />
            </CoSection>
            <CoSection title="Responsables">
              <CoField label="Directeur général"  value={co.nom_dg} />
              <CoField label="Resp. DNPEC"        value={co.responsable_dnpec} />
            </CoSection>
            <CoSection title="Activité économique">
              <CoField label="Code NACE"       value={co.activite_nace} mono />
              <CoField label="Capital social"  value={co.capital_social != null ? new Intl.NumberFormat("fr-FR").format(co.capital_social) + " GNF" : null} />
              <CoField label="Année création"  value={co.creation_year ? String(co.creation_year) : null} />
              <CoField label="Date création"   value={fmtDate(co.date_creation)} />
            </CoSection>
          </div>
        )}
      </div>

      {/* ── Action footer ─────────────────────────────────────────── */}
      {canAct && (
        <div className="shrink-0 border-t border-border bg-card px-5 py-4 space-y-3">
          {actionError && (
            <p className="text-[11px] text-red-600 font-medium">{actionError}</p>
          )}

          {activeAction === null ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleValidate}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-white px-3 py-2 text-[11px] font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-subtle"
              >
                <CheckCircle2 className="size-3.5" />
                Valider
              </button>
              <button
                type="button"
                onClick={() => { setActiveAction("correction"); setActionError(null) }}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 px-3 py-2 text-[11px] font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors shadow-subtle"
              >
                <MessageSquare className="size-3.5" />
                Correction
              </button>
              <button
                type="button"
                onClick={() => { setActiveAction("reject"); setActionError(null) }}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-[11px] font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors shadow-subtle"
              >
                <XCircle className="size-3.5" />
                Rejeter
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold text-foreground">
                {activeAction === "correction"
                  ? "Message de correction à envoyer à l'entreprise"
                  : "Motif de rejet définitif"}
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  activeAction === "correction"
                    ? "Décrivez ce que l'entreprise doit corriger ou compléter…"
                    : "Expliquez pourquoi cette soumission est rejetée…"
                }
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs resize-none outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveAction(null); setComment(""); setActionError(null) }}
                  className="flex-1 rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCommentAction}
                  disabled={isPending || !comment.trim()}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-colors disabled:opacity-50",
                    activeAction === "correction"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-red-600 hover:bg-red-700",
                  )}
                >
                  {isPending
                    ? "Envoi…"
                    : activeAction === "correction"
                      ? "Envoyer le retour"
                      : "Confirmer le rejet"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-4 py-2 bg-muted/30 border-b border-border">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
      </div>
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  )
}

function CoField({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5">
      <dt className="w-32 shrink-0 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide pt-0.5">{label}</dt>
      <dd className={cn(
        "flex-1 text-xs",
        mono && "font-mono",
        value && value !== "—" ? "text-foreground font-medium" : "text-muted-foreground/40 italic",
      )}>
        {value ?? "—"}
      </dd>
    </div>
  )
}
