"use client"

import * as React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CompaniesTableClient, type TableCompany } from "./companies-table-client"
import { InscriptionQueueClient, type InscriptionCompany } from "./inscription-queue-client"
import { cn } from "@/lib/utils"

type Tab = "repertoire" | "inscriptions"

interface Props {
  totalN: number
  statsChips: Array<{ count: number; label: string; color: string }>
  initialData: TableCompany[]
  sectors: Array<{ id: string; name: string }>
  total: number
  sectorBreakdown: Array<{ id: string; name: string; count: number }>
  totalCompanies: number
  pendingInscriptions: InscriptionCompany[]
}

export function EntreprisesView({
  totalN,
  statsChips,
  initialData,
  sectors,
  total,
  sectorBreakdown,
  totalCompanies,
  pendingInscriptions,
}: Props) {
  const [activeTab, setActiveTab] = React.useState<Tab>("repertoire")
  const [pendingCount, setPendingCount] = React.useState(pendingInscriptions.length)

  const tabs = [
    { key: "repertoire" as Tab, label: "Répertoire" },
    { key: "inscriptions" as Tab, label: "Inscriptions en attente", count: pendingCount },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary font-mono mb-1">
              Direction · Répertoire
            </p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Entreprises</h1>

            <div className="mt-2 flex items-center gap-2.5 flex-wrap">
              <span className="text-sm font-medium text-foreground tabular-nums">
                {totalN} entreprise{totalN !== 1 ? "s" : ""}
              </span>
              {statsChips.map((chip, i) => (
                <span key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="text-muted-foreground/40">·</span>
                  <span
                    className="size-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: chip.color }}
                  />
                  <span className="tabular-nums">{chip.count}</span>
                  <span>
                    {chip.label}
                    {chip.count > 1 && chip.label !== "en attente" ? "s" : ""}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {activeTab === "repertoire" && (
              <Button render={<Link href="/direction/entreprises/nouveau" />} nativeButton={false}>
                <Plus className="size-4" />
                Nouvelle entreprise
              </Button>
            )}
          </div>
        </div>

        {/* ── Tab navigation ────────────────────────────────────── */}
        <nav className="mt-5 flex gap-0 border-b border-border" aria-label="Onglets entreprises">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            const hasBadge = typeof tab.count === "number" && tab.count > 0

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative flex items-center gap-2 px-1 pb-3 mr-6 text-sm font-medium transition-colors focus-visible:outline-none",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}

                {hasBadge && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums leading-none",
                      "min-w-[18px] h-[18px] px-1.5",
                      isActive
                        ? "bg-status-warn-bg text-status-warn-text"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                )}

                {/* Active underline */}
                <span
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-[2px] rounded-t-sm transition-opacity",
                    isActive ? "bg-primary opacity-100" : "opacity-0",
                  )}
                />
              </button>
            )
          })}
        </nav>
      </div>

      {/* ── Tab content ──────────────────────────────────────────── */}
      <div className="flex-1 px-6 pt-5 pb-6 overflow-auto">
        {activeTab === "repertoire" ? (
          <CompaniesTableClient
            initialData={initialData}
            sectors={sectors}
            total={total}
            sectorBreakdown={sectorBreakdown}
            totalCompanies={totalCompanies}
          />
        ) : (
          <InscriptionQueueClient
            pending={pendingInscriptions}
            onItemRemoved={() => setPendingCount((n) => Math.max(0, n - 1))}
          />
        )}
      </div>
    </div>
  )
}
