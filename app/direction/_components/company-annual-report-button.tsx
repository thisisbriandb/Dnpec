"use client"

import * as React from "react"
import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface Props {
  companyId: string
}

export function CompanyAnnualReportButton({ companyId }: Props) {
  const [open, setOpen] = React.useState(false)
  const currentYear = new Date().getFullYear()
  const [year, setYear] = React.useState(currentYear)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  function handleDownload() {
    const url = `/api/v1/rapports/fiche-annuelle?company_id=${companyId}&year=${year}&format=pdf`
    window.open(url, "_blank", "noopener,noreferrer")
    setOpen(false)
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <FileDown className="size-3.5" />
        Fiche annuelle
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générer la fiche de collecte annuelle</DialogTitle>
            <DialogDescription>
              Pivot des rubriques mensuelles validées de cette entreprise pour l&apos;année
              choisie (12 colonnes), au format PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label htmlFor="annual-report-year" className="text-xs font-medium text-muted-foreground">
              Année
            </label>
            <select
              id="annual-report-year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleDownload} className="gap-1.5">
              <FileDown className="size-3.5" />
              Télécharger le PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
