import Link from "next/link"
import { ArrowRight, Layers, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Mock data ──────────────────────────────────────────────── */
type FormVersion = {
  number: number
  status: "published" | "draft" | "archived"
  published_at: string | null
  sections: number
  fields: number
}

type FormTemplate = {
  id: string
  sector: { name: string; code: string }
  title: string
  description: string
  activeCampaigns: number
  totalCampaigns: number
  currentVersion: FormVersion | null
}

const MOCK_TEMPLATES: FormTemplate[] = [
  {
    id: "f1",
    sector: { name: "Mines", code: "MINES" },
    title: "Formulaire de collecte minière",
    description: "Statistiques de production, emploi et finances des entreprises minières et extractives",
    activeCampaigns: 2,
    totalCampaigns: 8,
    currentVersion: { number: 3, status: "published", published_at: "2026-03-15", sections: 3, fields: 7 },
  },
  {
    id: "f2",
    sector: { name: "Finances", code: "FINANCE" },
    title: "Bilan statistique financier",
    description: "Collecte des indicateurs financiers, portefeuille et emploi du secteur bancaire et assurance",
    activeCampaigns: 1,
    totalCampaigns: 5,
    currentVersion: { number: 2, status: "published", published_at: "2025-11-20", sections: 4, fields: 12 },
  },
  {
    id: "f3",
    sector: { name: "Commerce", code: "COMMERCE" },
    title: "Enquête conjoncturelle commerce",
    description: "Chiffre d'affaires, stocks et emploi des entreprises du commerce et de la distribution",
    activeCampaigns: 1,
    totalCampaigns: 4,
    currentVersion: { number: 1, status: "published", published_at: "2025-09-10", sections: 2, fields: 8 },
  },
  {
    id: "f4",
    sector: { name: "Energie", code: "ENERGIE" },
    title: "Rapport énergétique semestriel",
    description: "Production, distribution et consommation d'énergie, capacités installées",
    activeCampaigns: 1,
    totalCampaigns: 2,
    currentVersion: { number: 2, status: "draft", published_at: null, sections: 3, fields: 10 },
  },
  {
    id: "f5",
    sector: { name: "Industrie", code: "INDUSTRIE" },
    title: "Enquête production industrielle",
    description: "Indicateurs de production, emploi et investissement du secteur industriel",
    activeCampaigns: 0,
    totalCampaigns: 1,
    currentVersion: null,
  },
]

/* ── Sector theming ─────────────────────────────────────────── */
const SECTOR_THEME: Record<string, { strip: string; icon: string; chipBg: string; chipText: string }> = {
  "Mines":     { strip: "bg-amber-500",    icon: "text-amber-600",   chipBg: "bg-amber-50",   chipText: "text-amber-800"   },
  "Finances":  { strip: "bg-blue-600",     icon: "text-blue-600",    chipBg: "bg-blue-50",    chipText: "text-blue-800"    },
  "Commerce":  { strip: "bg-orange-500",   icon: "text-orange-600",  chipBg: "bg-orange-50",  chipText: "text-orange-800"  },
  "Industrie": { strip: "bg-violet-500",   icon: "text-violet-600",  chipBg: "bg-violet-50",  chipText: "text-violet-800"  },
  "Energie":   { strip: "bg-emerald-600",  icon: "text-emerald-600", chipBg: "bg-emerald-50", chipText: "text-emerald-800" },
}

const VERSION_STATUS = {
  published: { label: "Publiée",  Icon: CheckCircle2, cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  draft:     { label: "Brouillon",Icon: AlertCircle,  cls: "text-amber-700   bg-amber-50   border-amber-200"   },
  archived:  { label: "Archivée", Icon: Clock,        cls: "text-gray-500    bg-gray-50    border-gray-200"    },
}

/* ── Computed totals ─────────────────────────────────────────── */
const published  = MOCK_TEMPLATES.filter(t => t.currentVersion?.status === "published").length
const withDraft  = MOCK_TEMPLATES.filter(t => t.currentVersion?.status === "draft").length
const unconfigured = MOCK_TEMPLATES.filter(t => !t.currentVersion).length
const totalActive  = MOCK_TEMPLATES.reduce((s, t) => s + t.activeCampaigns, 0)

/* ── Page ───────────────────────────────────────────────────── */
export default function FormulairesPage() {
  return (
    <div className="flex flex-col min-h-full">

      {/* ── Header ────────────────────────────────── */}
      <div className="px-6 py-5 border-b-2 border-border bg-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight text-foreground">Formulaires de collecte</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Un formulaire type par secteur d&apos;activité
            </p>
          </div>
          {/* Summary chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              <CheckCircle2 className="size-3.5" />{published} publiés
            </span>
            {withDraft > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                <AlertCircle className="size-3.5" />{withDraft} brouillon{withDraft > 1 ? "s" : ""}
              </span>
            )}
            {unconfigured > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 font-semibold border border-gray-200">
                <Clock className="size-3.5" />{unconfigured} non configuré{unconfigured > 1 ? "s" : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground font-semibold border border-border">
              <Layers className="size-3.5" />{totalActive} campagne{totalActive > 1 ? "s" : ""} active{totalActive > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── Cards grid ────────────────────────────── */}
      <div className="flex-1 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MOCK_TEMPLATES.map(tpl => <FormCard key={tpl.id} tpl={tpl} />)}
        </div>
      </div>
    </div>
  )
}

function FormCard({ tpl }: { tpl: FormTemplate }) {
  const theme  = SECTOR_THEME[tpl.sector.name] ?? { strip: "bg-gray-400", icon: "text-gray-500", chipBg: "bg-gray-100", chipText: "text-gray-700" }
  const cv     = tpl.currentVersion
  const vsCfg  = cv ? VERSION_STATUS[cv.status] : null

  return (
    <div className="group rounded-xl border-2 border-border bg-card shadow-medium overflow-hidden flex flex-col hover:shadow-strong transition-shadow">

      {/* Sector colour strip */}
      <div className={cn("h-1.5", theme.strip)} />

      <div className="p-5 flex flex-col flex-1 gap-4">

        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            {/* Sector icon area */}
            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60")}>
              <Layers className={cn("size-4", theme.icon)} />
            </div>
            <div className="min-w-0">
              <span className={cn(
                "inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1",
                theme.chipBg, theme.chipText,
              )}>
                {tpl.sector.code}
              </span>
              <p className="text-sm font-semibold text-foreground leading-tight">{tpl.sector.name}</p>
            </div>
          </div>

          {/* Version status badge */}
          {vsCfg ? (
            <span className={cn(
              "shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border",
              vsCfg.cls,
            )}>
              <vsCfg.Icon className="size-3" />
              {vsCfg.label}
            </span>
          ) : (
            <span className="shrink-0 text-[10px] font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
              Non configuré
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{tpl.description}</p>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs">
          {cv ? (
            <>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Version</span>
                <span className="font-bold tabular-nums text-foreground text-sm">v{cv.number}</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Sections</span>
                <span className="font-bold tabular-nums text-foreground text-sm">{cv.sections}</span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Champs</span>
                <span className="font-bold tabular-nums text-foreground text-sm">{cv.fields}</span>
              </div>
            </>
          ) : (
            <span className="text-muted-foreground text-xs italic">Aucune version disponible</span>
          )}

          {/* Campaigns badge */}
          {tpl.activeCampaigns > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
              {tpl.activeCampaigns} campagne{tpl.activeCampaigns > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Published date */}
        {cv?.published_at && cv.status === "published" && (
          <p className="text-[10px] text-muted-foreground/60">
            Publiée le {new Date(cv.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}

        {/* Action */}
        <div className="mt-auto pt-2 border-t border-border">
          <Link
            href={`/direction/formulaires/${tpl.id}`}
            className="flex items-center justify-between text-xs font-semibold text-primary hover:text-primary/80 transition-colors group/link"
          >
            <span>{cv?.status === "draft" ? "Modifier le brouillon" : "Configurer le formulaire"}</span>
            <ArrowRight className="size-3.5 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
