"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Inbox, Search, X, ChevronUp, ChevronDown, Eye, CheckCircle2, XCircle,
  MessageSquare, FileText, AlertTriangle, Check, Download, Megaphone,
  CalendarDays, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatNIF, formatDate, formatDateTime, formatRelative } from "@/lib/format"
import { StatusBadge } from "@/components/ui/status-badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { validateSubmission, rejectSubmission, requestCorrection } from "@/app/actions/submissions"

/* ── Types ────────────────────────────────────────────────────────── */
type FormField = {
  key: string; label: string; type: string; required: boolean
  unit?: string | null; options?: unknown[]
}
type FormSection = { key: string; title: string; fields: FormField[] }
type FormSchema = { sections: FormSection[] }

export type QueueSubmissionStatus = "submitted" | "validated" | "rejected" | "correction_requested"

export type QueueSubmission = {
  id: string
  status: QueueSubmissionStatus
  submitted_at: string | null
  validated_at: string | null
  rejection_comment: string | null
  answers: Record<string, unknown>
  completion_rate: number
  campaign: {
    id: string
    title: string
    reference_period: string
    closes_at: string
    sector: { name: string; code: string } | null
    form_template: { id: string; title: string; schema: FormSchema }
  }
  company: {
    id: string; name: string; nif: string; rccm: string | null
    size: string; legal_status: string; contact_email: string; phone: string
    address: string | null; sigle: string | null; nom_dg: string | null
    region: string | null; commune: string | null; date_creation: string | null
    responsable_dnpec: string | null; activite_nace: string | null
    capital_social: number | null; creation_year: number | null
    sector: { name: string; code: string } | null
  }
}

type StatusFilter = "actionable" | QueueSubmissionStatus | "all"

const PAGE_SIZE = 10

const SIZE_LBL: Record<string, string> = { tpe: "TPE", pme: "PME", grande_entreprise: "Grande entreprise" }
const LEGAL_LBL: Record<string, string> = { sa: "S.A.", sarl: "S.A.R.L.", suarl: "S.U.A.R.L.", gie: "G.I.E.", public: "Public", autre: "Autre" }

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "actionable", label: "À traiter" },
  { value: "submitted", label: "Soumises" },
  { value: "correction_requested", label: "Correction demandée" },
  { value: "validated", label: "Validées" },
  { value: "rejected", label: "Rejetées" },
  { value: "all", label: "Toutes" },
]

/* ── Helpers ──────────────────────────────────────────────────────── */
function daysSince(date: string | null): number | null {
  if (!date) return null
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000)
}
function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000)
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
  if (field.type === "date") return formatDate(value as string)
  if (field.type === "multi_select") {
    const arr = Array.isArray(value) ? value : [value]
    return arr.map((v) => normalizeOption(v)).join(", ") || "—"
  }
  if (field.type === "single_select") return normalizeOption(value)
  if (field.type === "data_table") return "[Tableau]"
  if (field.type === "file") return "[Fichier joint]"
  return String(value)
}
function rateColor(rate: number) {
  return rate >= 80 ? "#22c55e" : rate >= 50 ? "#3b82f6" : "#f59e0b"
}
function exportCSV(rows: QueueSubmission[], name: string) {
  const header = ["Entreprise", "NIF", "Campagne", "Statut", "Soumis le", "Taux (%)"]
  const body = rows.map((s) => [
    s.company.name,
    s.company.nif,
    `${s.campaign.title} (${s.campaign.reference_period})`,
    s.status,
    s.submitted_at ? formatDateTime(s.submitted_at) : "—",
    String(Math.round(s.completion_rate)),
  ])
  const csv = [header, ...body].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}

/* ══════════════════════════════════════════════════════════════════ */
export function ValidationsQueueClient({ submissions }: { submissions: QueueSubmission[] }) {
  const router = useRouter()
  const [data, setData] = React.useState<QueueSubmission[]>(submissions)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("actionable")
  const [campaignFilter, setCampaignFilter] = React.useState("")
  const [sortCol, setSortCol] = React.useState<"company" | "campaign" | "status" | "submitted_at" | "rate">("submitted_at")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc")
  const [page, setPage] = React.useState(1)
  const [reviewing, setReviewing] = React.useState<QueueSubmission | null>(null)

  const campaigns = React.useMemo(() => {
    const m = new Map<string, { id: string; title: string; reference_period: string }>()
    for (const s of data) m.set(s.campaign.id, { id: s.campaign.id, title: s.campaign.title, reference_period: s.campaign.reference_period })
    return [...m.values()].sort((a, b) => a.title.localeCompare(b.title))
  }, [data])

  const counts = React.useMemo(() => {
    const m: Record<string, number> = {}
    for (const s of data) m[s.status] = (m[s.status] ?? 0) + 1
    const today = new Date().toDateString()
    const validatedToday = data.filter((s) => s.validated_at && new Date(s.validated_at).toDateString() === today).length
    return {
      submitted: m.submitted ?? 0,
      correction_requested: m.correction_requested ?? 0,
      validated: m.validated ?? 0,
      rejected: m.rejected ?? 0,
      actionable: (m.submitted ?? 0) + (m.correction_requested ?? 0),
      validatedToday,
    }
  }, [data])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    let res = data.filter((s) => {
      const okQ = !q || s.company.name.toLowerCase().includes(q) || s.company.nif.toLowerCase().includes(q)
      const okC = !campaignFilter || s.campaign.id === campaignFilter
      const okS =
        statusFilter === "all" ? true
        : statusFilter === "actionable" ? (s.status === "submitted" || s.status === "correction_requested")
        : s.status === statusFilter
      return okQ && okC && okS
    })
    res = [...res].sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0
      if (sortCol === "company") { av = a.company.name; bv = b.company.name }
      else if (sortCol === "campaign") { av = a.campaign.title; bv = b.campaign.title }
      else if (sortCol === "status") { av = a.status; bv = b.status }
      else if (sortCol === "rate") { av = a.completion_rate; bv = b.completion_rate }
      else { av = a.submitted_at ?? ""; bv = b.submitted_at ?? "" }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === "asc" ? cmp : -cmp
    })
    return res
  }, [data, search, campaignFilter, statusFilter, sortCol, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, pageCount)
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)

  function updateSearch(v: string) { setSearch(v); setPage(1) }
  function updateStatusFilter(v: StatusFilter) { setStatusFilter(v); setPage(1) }
  function updateCampaignFilter(v: string) { setCampaignFilter(v); setPage(1) }

  function toggleSort(col: string) {
    const c = col as typeof sortCol
    if (sortCol === c) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortCol(c); setSortDir("asc") }
  }

  function applyUpdate(id: string, update: Partial<QueueSubmission>) {
    setData((prev) => prev.map((s) => (s.id === id ? { ...s, ...update } : s)))
    setReviewing((prev) => (prev && prev.id === id ? { ...prev, ...update } : prev))
    router.refresh()
  }

  function quickValidate(s: QueueSubmission) {
    toast.promise(validateSubmission(s.id), {
      loading: "Validation en cours…",
      success: (res) => {
        if (res && "error" in res) throw new Error(res.error)
        applyUpdate(s.id, { status: "validated", validated_at: new Date().toISOString(), rejection_comment: null })
        return `${s.company.name} validée.`
      },
      error: (e) => e.message ?? "Erreur lors de la validation.",
    })
  }

  const resetFilters = () => { setSearch(""); setStatusFilter("all"); setCampaignFilter(""); setPage(1) }

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="shrink-0 px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight text-foreground">File de validation</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {counts.actionable} soumission{counts.actionable !== 1 ? "s" : ""} à traiter
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportCSV(filtered, `validations-${Date.now()}.csv`)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors shadow-subtle disabled:opacity-50"
          >
            <Download className="size-3.5" />
            Exporter ({filtered.length})
          </button>
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-5 pb-4 space-y-3 border-b border-border" style={{ background: "hsl(var(--muted)/0.25)" }}>
        <div className="grid grid-cols-5 gap-3">
          <KpiCard value={counts.actionable} label="À traiter" sub="Action requise" icon={<Zap className="size-5 text-primary" />} iconBg="bg-primary/10" accent="from-primary/60 via-primary to-primary/60" hl={counts.actionable > 0} />
          <KpiCard value={counts.submitted} label="Soumises" sub="En attente d'examen" icon={<FileText className="size-5 text-blue-600" />} iconBg="bg-blue-50" accent="from-blue-400/60 via-blue-500 to-blue-400/60" />
          <KpiCard value={counts.correction_requested} label="Correction dem." sub="Retour entreprise" icon={<MessageSquare className="size-5 text-amber-600" />} iconBg="bg-amber-50" accent="from-amber-400/60 via-amber-500 to-amber-400/60" />
          <KpiCard value={counts.validated} label="Validées" sub={`${counts.validatedToday} aujourd'hui`} icon={<CheckCircle2 className="size-5 text-emerald-600" />} iconBg="bg-emerald-50" accent="from-emerald-400/60 via-emerald-500 to-emerald-400/60" />
          <KpiCard value={counts.rejected} label="Rejetées" sub="Définitivement closes" icon={<XCircle className="size-5 text-red-500" />} iconBg="bg-red-50" accent="from-red-400/60 via-red-500 to-red-400/60" />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 rounded-xl bg-card border border-border p-1 shadow-subtle">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => updateStatusFilter(tab.value)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all whitespace-nowrap",
                  statusFilter === tab.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 w-56">
              <Search className="size-3.5 text-muted-foreground/50 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder="Entreprise ou NIF…"
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
              />
              {search && (
                <button type="button" onClick={() => updateSearch("")} className="text-muted-foreground/50 hover:text-foreground">
                  <X className="size-3" />
                </button>
              )}
            </div>

            <select
              value={campaignFilter}
              onChange={(e) => updateCampaignFilter(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground outline-none cursor-pointer max-w-48"
            >
              <option value="">Toutes les campagnes</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.title} ({c.reference_period})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="rounded-2xl border border-border bg-card shadow-subtle overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {filtered.length} soumission{filtered.length !== 1 ? "s" : ""}
            </p>
            {(search || statusFilter !== "all" || campaignFilter) && filtered.length === 0 && (
              <button type="button" onClick={resetFilters} className="text-xs text-primary hover:underline">
                Réinitialiser les filtres
              </button>
            )}
          </div>

          {data.length === 0 ? (
            <EmptyState icon={Inbox} title="Aucune soumission à traiter" description="Toutes les soumissions ont été examinées." size="lg" />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Search} title="Aucun résultat" description="Aucune soumission ne correspond à ces filtres." size="lg" action={{ label: "Réinitialiser les filtres", onClick: resetFilters }} />
          ) : (
            <div className="overflow-x-auto" style={{ scrollbarWidth: "thin" }}>
              <table className="w-full text-sm border-collapse">
                <thead className="bg-muted/70 border-b border-border">
                  <tr>
                    <SortTh label="Entreprise" col="company" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                    <SortTh label="Campagne" col="campaign" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                    <SortTh label="Complétude" col="rate" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                    <SortTh label="Statut" col="status" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                    <SortTh label="Soumis le" col="submitted_at" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                    <th className="px-3 py-3 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {pageRows.map((s) => {
                    const wait = daysSince(s.submitted_at)
                    const closingSoon = daysUntil(s.campaign.closes_at)
                    const actionable = s.status === "submitted" || s.status === "correction_requested"
                    return (
                      <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5 min-w-[180px]">
                          <p className="font-medium text-foreground text-xs truncate max-w-[220px]">{s.company.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{formatNIF(s.company.nif)}</p>
                        </td>
                        <td className="px-3 py-2.5 min-w-[150px]">
                          <p className="text-xs text-foreground truncate max-w-[180px]">{s.campaign.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10px] text-muted-foreground">{s.campaign.reference_period}</p>
                            {actionable && closingSoon <= 7 && (
                              <span className={cn(
                                "inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                closingSoon <= 3 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600",
                              )}>
                                <CalendarDays className="size-2.5" />
                                {closingSoon > 0 ? `J-${closingSoon}` : "Clôturée"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${s.completion_rate}%`, backgroundColor: rateColor(s.completion_rate) }} />
                            </div>
                            <span className="text-[10px] tabular-nums text-muted-foreground">{Math.round(s.completion_rate)}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <StatusBadge status={s.status} size="sm" />
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <p className="text-xs text-muted-foreground">{formatDate(s.submitted_at)}</p>
                          {actionable && wait !== null && wait >= 5 && (
                            <span className={cn(
                              "inline-flex items-center gap-1 text-[9px] font-semibold mt-0.5",
                              wait >= 10 ? "text-red-600" : "text-amber-600",
                            )}>
                              <AlertTriangle className="size-2.5" />
                              En attente {wait}j
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {actionable && s.completion_rate === 100 && (
                              <button
                                type="button"
                                onClick={() => quickValidate(s)}
                                title="Validation rapide (100% complet)"
                                className="inline-flex items-center justify-center rounded-lg size-7 border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              >
                                <Check className="size-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setReviewing(s)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-subtle transition-all"
                            >
                              <Eye className="size-3.5" />
                              Examiner
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-border">
              <Pagination page={pageSafe} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* ── Review drawer ────────────────────────────────────── */}
      {reviewing && (
        <ReviewDrawer submission={reviewing} onClose={() => setReviewing(null)} onUpdate={applyUpdate} />
      )}
    </div>
  )
}

/* ── KPI card ─────────────────────────────────────────────────────── */
function KpiCard({
  value, label, sub, icon, iconBg, accent, hl,
}: { value: number; label: string; sub?: string; icon: React.ReactNode; iconBg: string; accent: string; hl?: boolean }) {
  return (
    <div className={cn(
      "relative rounded-2xl border p-4 shadow-subtle overflow-hidden flex items-center gap-3",
      hl && value > 0 ? "border-primary/30 bg-primary/5" : "border-border bg-card",
    )}>
      <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r rounded-t-2xl", accent)} />
      <div className={cn("flex size-10 items-center justify-center rounded-xl shrink-0", iconBg)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[24px] font-bold leading-none tabular-nums text-foreground">{value}</p>
        <p className="text-[10px] font-semibold text-muted-foreground mt-1.5 leading-tight">{label}</p>
        {sub && <p className="text-[9px] text-muted-foreground/50 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

/* ── Sortable header ──────────────────────────────────────────────── */
function SortTh({
  label, col, sortCol, sortDir, onSort,
}: { label: string; col: string; sortCol: string; sortDir: "asc" | "desc"; onSort: (c: string) => void }) {
  const active = sortCol === col
  return (
    <th
      onClick={() => onSort(col)}
      className={cn(
        "px-3 py-3 text-left cursor-pointer select-none whitespace-nowrap",
        "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
        active && "text-foreground",
      )}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={cn("transition-colors", active ? "text-foreground" : "text-muted-foreground/25")}>
          {active ? (sortDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />) : <ChevronDown className="size-3" />}
        </span>
      </div>
    </th>
  )
}

/* ── Review drawer ────────────────────────────────────────────────── */
function ReviewDrawer({
  submission, onClose, onUpdate,
}: {
  submission: QueueSubmission
  onClose: () => void
  onUpdate: (id: string, update: Partial<QueueSubmission>) => void
}) {
  const co = submission.company
  const sections = submission.campaign.form_template.schema?.sections ?? []
  const [tab, setTab] = React.useState<"answers" | "company">("answers")
  const [activeAction, setActiveAction] = React.useState<"correction" | "reject" | null>(null)
  const [comment, setComment] = React.useState("")
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const canAct = submission.status === "submitted" || submission.status === "correction_requested"

  function handleValidate() {
    setActionError(null)
    startTransition(async () => {
      const res = await validateSubmission(submission.id)
      if (res && "error" in res) { setActionError(res.error); return }
      onUpdate(submission.id, { status: "validated", validated_at: new Date().toISOString(), rejection_comment: null })
      toast.success(`${co.name} validée.`)
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
      onUpdate(submission.id, { status: newStatus, rejection_comment: comment })
      toast.success(activeAction === "correction" ? "Retour envoyé à l'entreprise." : "Soumission rejetée.")
      setActiveAction(null)
      setComment("")
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/10" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-40 flex flex-col bg-card border-l border-border shadow-2xl" style={{ width: 440, top: 56 }}>
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

          <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 border border-border px-2.5 py-1.5">
            <Megaphone className="size-3 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-foreground font-medium truncate">{submission.campaign.title}</p>
            <span className="text-[10px] text-muted-foreground shrink-0">· {submission.campaign.reference_period}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={submission.status} size="sm" />
            <span className="text-[10px] text-muted-foreground">Taux : <strong>{Math.round(submission.completion_rate)}%</strong></span>
            <span className="text-[10px] text-muted-foreground">{formatDateTime(submission.submitted_at)}</span>
            {submission.submitted_at && (
              <span className="text-[10px] text-muted-foreground/60">({formatRelative(submission.submitted_at)})</span>
            )}
          </div>

          {submission.rejection_comment && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-0.5">
                {submission.status === "correction_requested" ? "Demande de correction" : "Motif de rejet"}
              </p>
              <p className="text-xs text-red-700">{submission.rejection_comment}</p>
            </div>
          )}

          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {(["answers", "company"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all",
                  tab === k ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                )}
              >
                {k === "answers" ? "Réponses formulaire" : "Détails entreprise"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth: "thin" }}>
          {tab === "answers" ? (
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
                    const val = submission.answers[field.key]
                    const isEmpty = val === null || val === undefined || val === ""
                    return (
                      <div key={field.key} className="px-4 py-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{field.label}</p>
                          {field.required && <span className="text-[9px] text-red-400 font-bold">REQ.</span>}
                          {field.unit && <span className="text-[9px] font-mono bg-muted border border-border px-1 rounded">{field.unit}</span>}
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
                            {val === "true" || val === true ? <><Check className="size-3.5" />Oui</> : <><X className="size-3.5" />Non</>}
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
          ) : (
            <div className="space-y-4">
              <CoSection title="Identité">
                <CoField label="Raison sociale" value={co.name} />
                <CoField label="Sigle" value={co.sigle} />
                <CoField label="NIF" value={co.nif} mono />
                <CoField label="RCCM" value={co.rccm} mono />
                <CoField label="Statut juridique" value={LEGAL_LBL[co.legal_status] ?? co.legal_status} />
                <CoField label="Taille" value={SIZE_LBL[co.size] ?? co.size} />
                <CoField label="Secteur" value={co.sector ? `${co.sector.name} (${co.sector.code})` : null} />
              </CoSection>
              <CoSection title="Contact">
                <CoField label="Email" value={co.contact_email} />
                <CoField label="Téléphone" value={co.phone} />
                <CoField label="Adresse" value={co.address} />
                <CoField label="Région" value={co.region} />
                <CoField label="Commune" value={co.commune} />
              </CoSection>
              <CoSection title="Responsables">
                <CoField label="Directeur général" value={co.nom_dg} />
                <CoField label="Resp. DNPEC" value={co.responsable_dnpec} />
              </CoSection>
              <CoSection title="Activité économique">
                <CoField label="Code NACE" value={co.activite_nace} mono />
                <CoField label="Capital social" value={co.capital_social != null ? new Intl.NumberFormat("fr-FR").format(co.capital_social) + " GNF" : null} />
                <CoField label="Année création" value={co.creation_year ? String(co.creation_year) : null} />
                <CoField label="Date création" value={formatDate(co.date_creation)} />
              </CoSection>
            </div>
          )}
        </div>

        {canAct && (
          <div className="shrink-0 border-t border-border bg-card px-5 py-4 space-y-3">
            {actionError && <p className="text-[11px] text-red-600 font-medium">{actionError}</p>}

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
                  {activeAction === "correction" ? "Message de correction à envoyer à l'entreprise" : "Motif de rejet définitif"}
                </p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={activeAction === "correction" ? "Décrivez ce que l'entreprise doit corriger ou compléter…" : "Expliquez pourquoi cette soumission est rejetée…"}
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
                      activeAction === "correction" ? "bg-amber-500 hover:bg-amber-600" : "bg-red-600 hover:bg-red-700",
                    )}
                  >
                    {isPending ? "Envoi…" : activeAction === "correction" ? "Envoyer le retour" : "Confirmer le rejet"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
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
      <dd className={cn("flex-1 text-xs", mono && "font-mono", value && value !== "—" ? "text-foreground font-medium" : "text-muted-foreground/40 italic")}>
        {value ?? "—"}
      </dd>
    </div>
  )
}
