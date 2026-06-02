"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Building2,
  FileText,
  Megaphone,
  CheckSquare,
  BarChart3,
  Download,
  Shield,
  LayoutDashboard,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Info,
  Loader2,
  Search,
  Filter,
  Inbox,
  RefreshCw,
} from "lucide-react"

// Shadcn base
import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

// Custom
import { StatusBadge } from "@/components/ui/status-badge"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonStatCard, SkeletonTableRow } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { SearchInput } from "@/components/ui/search-input"
import { FilterChips } from "@/components/ui/filter-chips"
import { Stepper } from "@/components/ui/stepper"
import { Toaster } from "@/components/ui/toaster"
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette"
import { DataTable } from "@/components/ui/data-table"
import { Sidebar, SidebarHeaderDNPEC } from "@/components/ui/sidebar"

// Lib
import { formatGNF, formatPercent, formatDate, formatCompact } from "@/lib/format"

/* ── Section wrapper ──────────────────────────────────────────── */
function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-4 scroll-mt-6">
      <div className="flex items-center gap-3">
        <h2 className="text-title font-semibold text-foreground">{title}</h2>
        <Separator className="flex-1" />
        <a href={`#${id}`} className="text-legend text-muted-foreground hover:text-foreground">#{id}</a>
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      {label && <p className="text-legend text-muted-foreground">{label}</p>}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

/* ── Mock data ────────────────────────────────────────────────── */
const MOCK_COMPANIES = [
  { id: "1", nom: "SONFONIA Mining SA", nif: "000 001 234", secteur: "Mines", statut: "validated", chiffre_affaires: 4820000000, taux_reponse: 94 },
  { id: "2", nom: "Hydro Guinée SARL", nif: "000 002 567", secteur: "Energie", statut: "pending", chiffre_affaires: 1200000000, taux_reponse: 0 },
  { id: "3", nom: "BancaGuinée SA", nif: "000 003 890", secteur: "Finances", statut: "validated", chiffre_affaires: 9300000000, taux_reponse: 100 },
  { id: "4", nom: "Commerce Plus SUARL", nif: "000 004 123", secteur: "Commerce", statut: "rejected", chiffre_affaires: 340000000, taux_reponse: 0 },
  { id: "5", nom: "IndusForge GIE", nif: "000 005 456", secteur: "Industrie", statut: "suspended", chiffre_affaires: 670000000, taux_reponse: 68 },
]

const SPARKLINE_DATA = [
  { value: 65 }, { value: 72 }, { value: 68 }, { value: 79 }, { value: 85 },
  { value: 81 }, { value: 88 }, { value: 92 }, { value: 89 }, { value: 94 },
]

const STEPPER_STEPS = [
  { id: "config", label: "Configuration", description: "Paramètres de base" },
  { id: "formulaire", label: "Formulaire", description: "Sélection du modèle" },
  { id: "cibles", label: "Entreprises cibles", description: "Sélection des cibles" },
  { id: "envoi", label: "Envoi", description: "Confirmation et envoi" },
]

const SIDEBAR_GROUPS = [
  {
    items: [
      { href: "/direction/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    ],
  },
  {
    label: "Collecte",
    items: [
      { href: "/direction/entreprises", label: "Entreprises", icon: Building2, badge: 12 },
      { href: "/direction/formulaires", label: "Formulaires", icon: FileText },
      { href: "/direction/campagnes", label: "Campagnes", icon: Megaphone },
      { href: "/direction/validations", label: "Validations", icon: CheckSquare, badge: 5 },
    ],
  },
  {
    label: "Analyse",
    items: [
      { href: "/direction/analyses", label: "Indices ICA/ICE", icon: BarChart3 },
      { href: "/direction/exports", label: "Exports", icon: Download },
      { href: "/direction/audit", label: "Audit", icon: Shield, requiredRoles: ["super_admin" as const] },
    ],
  },
]

/* ── DataTable columns ────────────────────────────────────────── */
import type { ColumnDef } from "@tanstack/react-table"

type Company = typeof MOCK_COMPANIES[0]

const TABLE_COLUMNS: ColumnDef<Company, unknown>[] = [
  {
    accessorKey: "nom",
    header: "Entreprise",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-foreground">{row.original.nom}</p>
        <p className="text-legend text-muted-foreground text-mono">{row.original.nif}</p>
      </div>
    ),
  },
  {
    accessorKey: "secteur",
    header: "Secteur",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "statut",
    header: "Statut",
    cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
  },
  {
    accessorKey: "chiffre_affaires",
    header: () => <span className="block text-right w-full">Chiffre d&apos;affaires</span>,
    cell: ({ getValue }) => (
      <span className="block text-right text-mono text-sm tabular-nums">
        {formatGNF(getValue() as number)}
      </span>
    ),
  },
  {
    accessorKey: "taux_reponse",
    header: () => <span className="block text-right w-full">Taux réponse</span>,
    cell: ({ getValue }) => {
      const v = getValue() as number
      return (
        <div className="flex items-center justify-end gap-2">
          <Progress value={v} className="h-1.5 w-16" />
          <span className="text-mono text-sm tabular-nums w-10 text-right">{formatPercent(v)}</span>
        </div>
      )
    },
  },
]

/* ── Page ─────────────────────────────────────────────────────── */
export default function DesignSystemPage() {
  const [paginationPage, setPaginationPage] = React.useState(3)
  const [searchValue, setSearchValue] = React.useState("")
  const [activeFilters, setActiveFilters] = React.useState([
    { key: "secteur", label: "Secteur", value: "Mines" },
    { key: "statut", label: "Statut", value: "Active" },
  ])
  const [stepperStep, setStepperStep] = React.useState(1)
  const { open, setOpen } = useCommandPalette()

  const COLOR_TOKENS = [
    { name: "primary (navy)", var: "--primary", hex: "#0f2b4c" },
    { name: "accent (teal)", var: "--accent", hex: "#14b8a6" },
    { name: "background", var: "--background", hex: "#f4f5f7" },
    { name: "surface", var: "--surface", hex: "#ffffff" },
    { name: "border", var: "--border", hex: "#e5e7eb" },
    { name: "muted-fg", var: "--muted-foreground", hex: "#6b7280" },
    { name: "status-ok", var: "--status-ok", hex: "#10b981" },
    { name: "status-warn", var: "--status-warn", hex: "#f59e0b" },
    { name: "status-bad", var: "--status-bad", hex: "#ef4444" },
    { name: "status-info", var: "--status-info", hex: "#3b82f6" },
    { name: "status-purple", var: "--status-purple", hex: "#8b5cf6" },
    { name: "chart-1", var: "--chart-1", hex: "#3b82f6" },
  ]

  return (
    <>
      <Toaster />
      <CommandPalette open={open} onOpenChange={setOpen} />

      <div className="min-h-screen bg-background">
        {/* Page header */}
        <div className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                D
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground">DNPEC — Design System</h1>
                <p className="text-legend text-muted-foreground">Tokens · Composants · États</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              className="gap-2 text-xs text-muted-foreground"
            >
              <Search className="size-3" />
              Rechercher
              <kbd className="rounded border border-border bg-muted px-1 text-[10px] font-mono">⌘K</kbd>
            </Button>
          </div>
        </div>

        {/* TOC + content */}
        <div className="mx-auto max-w-5xl px-6 py-8 space-y-12">

          {/* ── 1. Palette ─────────────────────────────────────── */}
          <Section title="1. Palette de couleurs" id="palette">
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {COLOR_TOKENS.map((t) => (
                <div key={t.var} className="space-y-1.5">
                  <div
                    className="h-12 w-full rounded-lg border border-border/50 ring-1 ring-border/30"
                    style={{ backgroundColor: t.hex }}
                  />
                  <p className="text-legend font-medium text-foreground truncate">{t.name}</p>
                  <p className="text-legend text-mono text-muted-foreground">{t.hex}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 2. Typographie ─────────────────────────────────── */}
          <Section title="2. Typographie" id="typography">
            <div className="rounded-card border border-border bg-card p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-legend text-muted-foreground">Display · 28px · 600</p>
                <p className="text-display">Plateforme Collecte DNPEC</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-legend text-muted-foreground">Title · 20px · 600</p>
                <p className="text-title">Tableau de bord — T1 2025</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-legend text-muted-foreground">Body · 13.5px · 400</p>
                <p className="text-body">La Plateforme DNPEC collecte les données conjoncturelles auprès des entreprises guinéennes pour le compte du Ministère de l&apos;économie, des finances et du budget.</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-legend text-muted-foreground">Legend · 11px · 400</p>
                <p className="text-legend">Source : enquête mensuelle de conjoncture · DNPEC · Min. Économie, Finances &amp; Budget</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-legend text-muted-foreground">Mono tabular · JetBrains Mono</p>
                <p className="text-mono text-title">4 820 000 000 GNF &nbsp; 68,4 % &nbsp; 12 oct. 2025</p>
              </div>
            </div>
          </Section>

          {/* ── 3. Formatage ───────────────────────────────────── */}
          <Section title="3. Formatage fr-FR" id="formatting">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Montant GNF", value: formatGNF(4820000000) },
                { label: "Pourcentage", value: formatPercent(68.4) },
                { label: "Date", value: formatDate("2025-10-12") },
                { label: "Compact", value: formatCompact(4820000000) + " GNF" },
              ].map((f) => (
                <div key={f.label} className="rounded-card border border-border bg-card p-3 space-y-1">
                  <p className="text-legend text-muted-foreground">{f.label}</p>
                  <p className="text-mono font-medium">{f.value}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 4. Boutons ─────────────────────────────────────── */}
          <Section title="4. Boutons" id="buttons">
            <Row label="Variantes">
              <Button variant="default">Principal</Button>
              <Button variant="outline">Secondaire</Button>
              <Button variant="ghost">Fantôme</Button>
              <Button variant="destructive">Supprimer</Button>
              <Button variant="link">Lien</Button>
            </Row>
            <Row label="Tailles">
              <Button size="sm">Petit</Button>
              <Button size="default">Défaut</Button>
              <Button size="lg">Grand</Button>
              <Button size="icon"><Plus /></Button>
            </Row>
            <Row label="États">
              <Button disabled>Désactivé</Button>
              <Button variant="outline" disabled>Désactivé outline</Button>
              <Button variant="default">
                <Loader2 className="size-4 animate-spin" />
                Chargement
              </Button>
              <Button variant="default">
                <Check className="size-4" />
                Validée
              </Button>
              <Button variant="destructive">
                <Trash2 className="size-4" />
                Rejeter
              </Button>
            </Row>
          </Section>

          {/* ── 5. Status Badges ───────────────────────────────── */}
          <Section title="5. Status Badges" id="badges">
            <div className="space-y-3">
              <Row label="account_status">
                <StatusBadge status="pending" />
                <StatusBadge status="validated" />
                <StatusBadge status="rejected" />
                <StatusBadge status="suspended" />
              </Row>
              <Row label="campaign_status">
                <StatusBadge status="draft" />
                <StatusBadge status="scheduled" />
                <StatusBadge status="active" />
                <StatusBadge status="closed" />
                <StatusBadge status="archived" />
              </Row>
              <Row label="submission_status">
                <StatusBadge status="draft" />
                <StatusBadge status="submitted" />
                <StatusBadge status="validated" />
                <StatusBadge status="rejected" />
                <StatusBadge status="correction_requested" />
              </Row>
              <Row label="size=sm">
                <StatusBadge status="validated" size="sm" />
                <StatusBadge status="pending" size="sm" />
                <StatusBadge status="rejected" size="sm" />
                <StatusBadge status="scheduled" size="sm" />
              </Row>
              <Row label="showDot=false">
                <StatusBadge status="validated" showDot={false} />
                <StatusBadge status="pending" showDot={false} />
              </Row>
            </div>
          </Section>

          {/* ── 6. Stat Cards ──────────────────────────────────── */}
          <Section title="6. Stat Cards" id="stat-cards">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Entreprises actives"
                value={formatCompact(1248) }
                delta={12.4}
                deltaLabel="vs T4 2024"
                sparkline={SPARKLINE_DATA}
                sparklineColor="ok"
              />
              <StatCard
                label="Taux de réponse"
                value={formatPercent(78.3)}
                delta={-3.2}
                deltaLabel="vs mois précédent"
                sparkline={SPARKLINE_DATA.map(d => ({ value: d.value * 0.8 }))}
                sparklineColor="warn"
              />
              <StatCard
                label="Campagnes actives"
                value="5"
                sparkline={SPARKLINE_DATA.map(d => ({ value: d.value * 0.5 + 20 }))}
                sparklineColor="info"
              />
              <StatCard
                label="Chargement…"
                loading={true}
              />
            </div>
          </Section>

          {/* ── 7. Data Table ──────────────────────────────────── */}
          <Section title="7. Data Table" id="data-table">
            <Tabs defaultValue="data">
              <TabsList>
                <TabsTrigger value="data">Données</TabsTrigger>
                <TabsTrigger value="loading">Chargement</TabsTrigger>
                <TabsTrigger value="empty">État vide</TabsTrigger>
              </TabsList>
              <TabsContent value="data" className="mt-3">
                <DataTable
                  data={MOCK_COMPANIES}
                  columns={TABLE_COLUMNS}
                  selectable
                  bulkActions={
                    <Button size="sm" variant="destructive" className="h-6 text-xs gap-1">
                      <Trash2 className="size-3" />
                      Supprimer
                    </Button>
                  }
                />
              </TabsContent>
              <TabsContent value="loading" className="mt-3">
                <DataTable
                  data={[]}
                  columns={TABLE_COLUMNS}
                  loading={true}
                  skeletonRows={5}
                />
              </TabsContent>
              <TabsContent value="empty" className="mt-3">
                <DataTable
                  data={[]}
                  columns={TABLE_COLUMNS}
                  emptyState={{
                    icon: Inbox,
                    title: "Aucune entreprise trouvée",
                    description: "Aucun résultat pour les filtres sélectionnés. Essayez d'élargir votre recherche.",
                    action: {
                      label: "Réinitialiser les filtres",
                      onClick: () => {},
                    },
                  }}
                />
              </TabsContent>
            </Tabs>
          </Section>

          {/* ── 8. Form Fields ─────────────────────────────────── */}
          <Section title="8. Champs de formulaire" id="forms">
            <div className="rounded-card border border-border bg-card p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Default */}
                <div className="space-y-1.5">
                  <label htmlFor="f-default" className="text-xs font-medium text-foreground">
                    Nom de l&apos;entreprise <span className="text-status-bad ml-0.5">*</span>
                  </label>
                  <Input id="f-default" placeholder="SONFONIA Mining SA" />
                </div>
                {/* Disabled */}
                <div className="space-y-1.5">
                  <label htmlFor="f-disabled" className="text-xs font-medium text-foreground">
                    NIF (non modifiable)
                  </label>
                  <Input id="f-disabled" value="000 001 234" disabled />
                </div>
                {/* Error */}
                <div className="space-y-1.5">
                  <label htmlFor="f-error" className="text-xs font-medium text-status-bad-text">
                    RCCM <span className="text-status-bad ml-0.5">*</span>
                  </label>
                  <Input
                    id="f-error"
                    aria-invalid
                    value="RCCM-12345"
                    className="border-status-bad focus-visible:ring-status-bad/30"
                  />
                  <p className="flex items-center gap-1 text-xs text-status-bad-text">
                    <AlertCircle className="size-3" />
                    Format RCCM invalide (ex : RCCM/GN/KKY/2024/B/00001)
                  </p>
                </div>
                {/* Valid */}
                <div className="space-y-1.5">
                  <label htmlFor="f-valid" className="text-xs font-medium text-foreground">
                    Email professionnel
                  </label>
                  <Input id="f-valid" type="email" value="contact@sonfonia.gn" className="border-status-ok/50 focus-visible:ring-status-ok/30" />
                  <p className="flex items-center gap-1 text-xs text-status-ok-text">
                    <Check className="size-3" />
                    Format valide
                  </p>
                </div>
                {/* Textarea */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="f-comment" className="text-xs font-medium text-foreground">
                    Commentaire
                    <span className="ml-1.5 text-muted-foreground font-normal">Facultatif</span>
                  </label>
                  <Textarea
                    id="f-comment"
                    placeholder="Motif de rejet ou demande de correction…"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* ── 9. Recherche & Filtres ─────────────────────────── */}
          <Section title="9. Recherche & Filtres" id="filters">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <SearchInput
                  value={searchValue}
                  onChange={setSearchValue}
                  placeholder="Rechercher une entreprise, un NIF…"
                  className="w-72"
                />
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Filter className="size-3.5" />
                  Filtres
                </Button>
              </div>
              <FilterChips
                filters={activeFilters}
                onRemove={(key) => setActiveFilters((prev) => prev.filter((f) => f.key !== key))}
                onReset={() => setActiveFilters([])}
              />
              {activeFilters.length === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setActiveFilters([
                    { key: "secteur", label: "Secteur", value: "Mines" },
                    { key: "statut", label: "Statut", value: "Active" },
                  ])}
                >
                  <RefreshCw className="size-3 mr-1" />
                  Rétablir les filtres
                </Button>
              )}
            </div>
          </Section>

          {/* ── 10. Stepper ────────────────────────────────────── */}
          <Section title="10. Stepper" id="stepper">
            <div className="space-y-4">
              <div className="rounded-card border border-border bg-card p-4">
                <Stepper
                  steps={STEPPER_STEPS}
                  currentStep={stepperStep}
                  onStepClick={setStepperStep}
                  orientation="horizontal"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStepperStep((s) => Math.max(0, s - 1))}
                  disabled={stepperStep === 0}
                >
                  Précédent
                </Button>
                <Button
                  size="sm"
                  onClick={() => setStepperStep((s) => Math.min(STEPPER_STEPS.length - 1, s + 1))}
                  disabled={stepperStep === STEPPER_STEPS.length - 1}
                >
                  Suivant
                </Button>
                <span className="text-xs text-muted-foreground">
                  Étape {stepperStep + 1} : {STEPPER_STEPS[stepperStep]?.label}
                </span>
              </div>
            </div>
          </Section>

          {/* ── 11. Sidebar ────────────────────────────────────── */}
          <Section title="11. Sidebar" id="sidebar">
            <div className="overflow-hidden rounded-card border border-border" style={{ height: 420 }}>
              <Sidebar
                groups={SIDEBAR_GROUPS}
                header={<SidebarHeaderDNPEC />}
                userRole="analyste"
                footer={
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <Avatar className="size-6">
                      <AvatarFallback className="bg-accent/20 text-accent text-[10px]">AM</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-sidebar-accent-foreground">Amadou Mbaye</p>
                      <p className="truncate text-[10px] text-sidebar-foreground/50">Analyste</p>
                    </div>
                  </div>
                }
              />
            </div>
          </Section>

          {/* ── 12. États vides ────────────────────────────────── */}
          <Section title="12. États vides" id="empty-states">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-card border border-border bg-card">
                <EmptyState
                  icon={Inbox}
                  title="Aucune soumission reçue"
                  description="Les soumissions des entreprises apparaîtront ici une fois la campagne démarrée."
                  action={{ label: "Démarrer une campagne", onClick: () => {} }}
                  size="md"
                />
              </div>
              <div className="rounded-card border border-border bg-card">
                <EmptyState
                  icon={AlertCircle}
                  title="Erreur de chargement"
                  description="Impossible de charger les données. Vérifiez votre connexion et réessayez."
                  action={{ label: "Réessayer", onClick: () => {} }}
                  size="md"
                />
              </div>
            </div>
          </Section>

          {/* ── 13. Skeletons ──────────────────────────────────── */}
          <Section title="13. Skeletons" id="skeletons">
            <div className="grid gap-3 sm:grid-cols-3">
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </div>
            <div className="mt-3 rounded-card border border-border overflow-hidden">
              <table className="w-full">
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonTableRow key={i} columns={5} />
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── 14. Pagination ─────────────────────────────────── */}
          <Section title="14. Pagination" id="pagination">
            <div className="rounded-card border border-border bg-card p-4">
              <Pagination
                page={paginationPage}
                pageCount={10}
                total={248}
                pageSize={25}
                onPageChange={setPaginationPage}
              />
            </div>
          </Section>

          {/* ── 15. Toasts ─────────────────────────────────────── */}
          <Section title="15. Toasts" id="toasts">
            <Row>
              <Button
                variant="default"
                size="sm"
                onClick={() => toast.success("Soumission validée avec succès.", { description: "SONFONIA Mining SA · T1 2025" })}
              >
                <Check className="size-4" />
                Succès
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.error("Erreur lors du rejet.", { description: "Vérifiez les champs obligatoires." })}
              >
                <AlertCircle className="size-4" />
                Erreur
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast.warning("Données incomplètes détectées.", { description: "3 champs sans valeur." })}
              >
                Avertissement
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast.info("Campagne planifiée pour le 01/02/2026.")}
              >
                <Info className="size-4" />
                Info
              </Button>
            </Row>
          </Section>

          {/* ── 16. Command Palette ────────────────────────────── */}
          <Section title="16. Palette de commandes ⌘K" id="command-palette">
            <div className="rounded-card border border-border bg-card p-4 flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setOpen(true)}
                className="gap-2 text-muted-foreground"
              >
                <Search className="size-4" />
                Ouvrir la palette
                <kbd className="rounded border border-border bg-muted px-1.5 text-xs font-mono">⌘K</kbd>
              </Button>
              <p className="text-sm text-muted-foreground">
                Ou appuyez <kbd className="rounded border border-border bg-muted px-1 text-xs font-mono">Ctrl+K</kbd> / <kbd className="rounded border border-border bg-muted px-1 text-xs font-mono">⌘K</kbd> n&apos;importe où.
              </p>
            </div>
          </Section>

          {/* ── 17. Progress ───────────────────────────────────── */}
          <Section title="17. Progress & Avatar" id="progress-avatar">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-card border border-border bg-card p-4 space-y-3">
                <p className="text-xs font-medium text-foreground">Progression</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Taux de réponse T1 2025</span>
                    <span className="text-mono">78 %</span>
                  </div>
                  <Progress value={78} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Validations complètes</span>
                    <span className="text-mono">94 %</span>
                  </div>
                  <Progress value={94} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Corrections en attente</span>
                    <span className="text-mono">31 %</span>
                  </div>
                  <Progress value={31} className="h-2" />
                </div>
              </div>
              <div className="rounded-card border border-border bg-card p-4 space-y-3">
                <p className="text-xs font-medium text-foreground">Avatars</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {["AM", "FK", "BS", "MK"].map((initials) => (
                    <div key={initials} className="flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{initials}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </>
  )
}
