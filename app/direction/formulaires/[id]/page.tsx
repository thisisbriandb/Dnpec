import Link from "next/link"
import { ArrowLeft, Plus, PencilLine, CheckCircle2, Clock, Archive, Eye, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Mock data ──────────────────────────────────────────────── */
type FormVersionStatus = "published" | "draft" | "archived"

const MOCK: {
  id: string
  sector: { name: string; code: string }
  title: string
  description: string
  currentVersionId: string
  versions: {
    id: string
    number: number
    status: FormVersionStatus
    published_at: string
    created_at: string
    created_by: string
    sections: { key: string; title: string; fields: { key: string; label: string; type: string; required: boolean; unit: string | null }[] }[]
  }[]
  activeCampaigns: { id: string; title: string; closes_at: string }[]
} = {
  id: "f1",
  sector: { name: "Mines", code: "MINES" },
  title: "Formulaire de collecte minière",
  description: "Statistiques de production, emploi et finances des entreprises minières et extractives.",
  currentVersionId: "v3",
  versions: [
    {
      id: "v3",
      number: 3,
      status: "published",
      published_at: "2026-03-15T14:30:00Z",
      created_at:   "2026-03-10T09:00:00Z",
      created_by: "Ibrahim Kouyaté",
      sections: [
        {
          key: "activite",
          title: "Activité générale",
          fields: [
            { key: "production_tonnes",     label: "Production mensuelle",   type: "integer", required: true,  unit: "tonnes" },
            { key: "export_tonnes",         label: "Volume exporté",         type: "integer", required: true,  unit: "tonnes" },
            { key: "chiffre_affaires_gnf",  label: "Chiffre d'affaires",     type: "decimal", required: true,  unit: "GNF"    },
          ],
        },
        {
          key: "emploi",
          title: "Emploi",
          fields: [
            { key: "employes_cdi", label: "Employés CDI", type: "integer", required: true,  unit: null },
            { key: "employes_cdd", label: "Employés CDD", type: "integer", required: true,  unit: null },
            { key: "salaire_moy",  label: "Salaire moyen", type: "decimal", required: false, unit: "GNF" },
          ],
        },
        {
          key: "pieces",
          title: "Pièces justificatives",
          fields: [
            { key: "rapport_mensuel", label: "Rapport mensuel", type: "file", required: false, unit: null },
          ],
        },
      ],
    },
    {
      id: "v2",
      number: 2,
      status: "archived",
      published_at: "2025-09-20T10:00:00Z",
      created_at:   "2025-09-15T08:00:00Z",
      created_by: "Mariam Diallo",
      sections: [],
    },
    {
      id: "v1",
      number: 1,
      status: "archived",
      published_at: "2025-03-01T08:00:00Z",
      created_at:   "2025-02-28T17:00:00Z",
      created_by: "Ibrahim Kouyaté",
      sections: [],
    },
  ],
  activeCampaigns: [
    { id: "c1", title: "Collecte mensuelle Mines — Mai 2026", closes_at: (() => { const d = new Date(); d.setDate(d.getDate() + 4); return d.toISOString() })() },
    { id: "c7", title: "Collecte mensuelle Mines — Juin 2026", closes_at: (() => { const d = new Date(); d.setDate(d.getDate() + 38); return d.toISOString() })() },
  ],
}

/* ── Config ─────────────────────────────────────────────────── */
const SECTOR_THEME: Record<string, { strip: string; chipBg: string; chipText: string }> = {
  "Mines":     { strip: "bg-amber-500",   chipBg: "bg-amber-500",   chipText: "text-white" },
  "Finances":  { strip: "bg-blue-600",    chipBg: "bg-blue-600",    chipText: "text-white" },
  "Commerce":  { strip: "bg-orange-500",  chipBg: "bg-orange-500",  chipText: "text-white" },
  "Industrie": { strip: "bg-violet-500",  chipBg: "bg-violet-500",  chipText: "text-white" },
  "Energie":   { strip: "bg-emerald-600", chipBg: "bg-emerald-600", chipText: "text-white" },
}

const VERSION_STATUS = {
  published: { label: "Publiée",   Icon: CheckCircle2, cls: "text-emerald-700 bg-emerald-50 border-emerald-200", timelineDot: "bg-emerald-500 ring-emerald-200" },
  draft:     { label: "Brouillon", Icon: PencilLine,   cls: "text-amber-700   bg-amber-50   border-amber-200",   timelineDot: "bg-amber-400   ring-amber-200"   },
  archived:  { label: "Archivée",  Icon: Archive,      cls: "text-gray-400    bg-gray-50    border-gray-200",    timelineDot: "bg-gray-300    ring-gray-100"    },
}

const FIELD_TYPE_LABEL: Record<string, string> = {
  integer: "Entier", decimal: "Décimal", short_text: "Texte court", long_text: "Texte long",
  date: "Date", single_select: "Sélection unique", multi_select: "Sélection multiple",
  checkbox: "Case à cocher", data_table: "Tableau", file: "Fichier",
}

/* ── Helpers ─────────────────────────────────────────────────── */
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}
function daysUntil(s: string) {
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86_400_000)
}

/* ── Page ───────────────────────────────────────────────────── */
export default async function FormulaireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await params

  const tpl         = MOCK
  const theme       = SECTOR_THEME[tpl.sector.name] ?? { strip: "bg-gray-400", chipBg: "bg-gray-500", chipText: "text-white" }
  const current     = tpl.versions.find(v => v.id === tpl.currentVersionId)!
  const hasDraft    = tpl.versions.some(v => v.status === "draft")
  const currentCfg  = VERSION_STATUS[current.status]
  const totalFields = current.sections.reduce((s, sec) => s + sec.fields.length, 0)

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Hero ────────────────────────────────────── */}
      <div className="border-b-2 border-border bg-card">
        <div className={cn("h-1.5", theme.strip)} />
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link
                href="/direction/formulaires"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <ArrowLeft className="size-3" /> Formulaires
              </Link>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider", theme.chipBg, theme.chipText)}>
                  {tpl.sector.code}
                </span>
                <span className="text-xs text-muted-foreground">{tpl.sector.name}</span>
              </div>
              <h1 className="text-[20px] font-semibold tracking-tight text-foreground">{tpl.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground max-w-xl">{tpl.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border", currentCfg.cls)}>
                <currentCfg.Icon className="size-3.5" />
                {currentCfg.label}
              </span>
              <Link
                href={`/direction/formulaires/${tpl.id}/nouvelle-version`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
              >
                {hasDraft ? <><PencilLine className="size-4" />Modifier le brouillon</> : <><Plus className="size-4" />Nouvelle version</>}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────── */}
      <div className="flex-1 p-6 space-y-5">

        {/* Current version stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Version courante", value: `v${current.number}`, sub: null },
            { label: "Sections",         value: current.sections.length, sub: null },
            { label: "Champs total",     value: totalFields, sub: null },
            { label: "Campagnes actives",value: tpl.activeCampaigns.length, sub: `sur ${tpl.activeCampaigns.length} total` },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-xl border-2 border-border bg-card p-4 shadow-medium">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
              <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
              {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Schema preview — current version */}
        <div className="rounded-xl border-2 border-border bg-card shadow-medium overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Structure — version courante (v{current.number})
            </h2>
            <Link
              href={`/direction/formulaires/${tpl.id}/nouvelle-version`}
              className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            >
              <Eye className="size-3.5" /> Aperçu complet
            </Link>
          </div>
          <div className="divide-y divide-border">
            {current.sections.map((section, si) => (
              <details key={section.key} open={si === 0} className="group/section">
                <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-muted/20 transition-colors list-none">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <span className="text-[10px] font-bold text-primary">{si + 1}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground flex-1">{section.title}</span>
                  <span className="text-[10px] text-muted-foreground font-medium mr-2">{section.fields.length} champ{section.fields.length > 1 ? "s" : ""}</span>
                  <ChevronDown className="size-4 text-muted-foreground transition-transform group-open/section:rotate-180" />
                </summary>
                <div className="px-5 pb-3 bg-muted/10">
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border">
                          <th className="text-left px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Champ</th>
                          <th className="text-left px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Type</th>
                          <th className="text-left px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Unité</th>
                          <th className="text-center px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Requis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {section.fields.map(f => (
                          <tr key={f.key} className="hover:bg-muted/20 transition-colors">
                            <td className="px-3 py-2.5">
                              <p className="font-medium text-foreground">{f.label}</p>
                              <p className="text-muted-foreground/60 font-mono text-[10px]">{f.key}</p>
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">
                              {FIELD_TYPE_LABEL[f.type] ?? f.type}
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell">
                              {f.unit ?? <span className="text-muted-foreground/40">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {f.required
                                ? <span className="inline-block size-2 rounded-full bg-emerald-500" title="Requis" />
                                : <span className="inline-block size-2 rounded-full bg-gray-200" title="Optionnel" />
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Version history timeline */}
          <div className="rounded-xl border-2 border-border bg-card shadow-medium overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-muted/20">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Historique des versions</h2>
            </div>
            <div className="p-4">
              <ol className="relative space-y-0">
                {tpl.versions.map((v, i) => {
                  const cfg     = VERSION_STATUS[v.status]
                  const isCurrent = v.id === tpl.currentVersionId
                  const isLast  = i === tpl.versions.length - 1
                  return (
                    <li key={v.id} className="flex gap-4">
                      {/* Timeline spine */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "size-3 rounded-full ring-4 shrink-0 mt-1",
                          cfg.timelineDot,
                          isCurrent ? "ring-4" : "ring-2",
                        )} />
                        {!isLast && <div className="w-px flex-1 bg-border my-1" />}
                      </div>
                      <div className={cn("pb-5 min-w-0 flex-1", isLast && "pb-1")}>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-bold text-foreground">v{v.number}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">Courante</span>
                          )}
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", cfg.cls)}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Créée par <span className="font-medium text-foreground">{v.created_by}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {v.published_at
                            ? `Publiée le ${fmtDate(v.published_at)}`
                            : `Créée le ${fmtDate(v.created_at)}`
                          }
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>

          {/* Active campaigns using this form */}
          <div className="rounded-xl border-2 border-border bg-card shadow-medium overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Campagnes utilisant ce formulaire
              </h2>
              <span className="text-xs text-muted-foreground">{tpl.activeCampaigns.length} active{tpl.activeCampaigns.length > 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-border">
              {tpl.activeCampaigns.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-muted-foreground">Aucune campagne active</p>
                </div>
              ) : (
                tpl.activeCampaigns.map(camp => {
                  const days = daysUntil(camp.closes_at)
                  return (
                    <Link
                      key={camp.id}
                      href={`/direction/campagnes/${camp.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors group"
                    >
                      <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                      <p className="text-sm text-foreground flex-1 truncate">{camp.title}</p>
                      <span className={cn(
                        "text-[10px] font-bold tabular-nums shrink-0",
                        days <= 7 ? "text-red-600" : "text-muted-foreground",
                      )}>
                        J‑{days}
                      </span>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
