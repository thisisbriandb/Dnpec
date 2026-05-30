"use client"

import * as React from "react"
import { X, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FilterChip {
  key: string
  label: string
  value: string
}

interface FilterChipsProps {
  filters: FilterChip[]
  onRemove: (key: string) => void
  onReset: () => void
  className?: string
}

function FilterChips({ filters, onRemove, onReset, className }: FilterChipsProps) {
  if (filters.length === 0) return null

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      aria-label="Filtres actifs"
    >
      <span className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
        <SlidersHorizontal className="size-3" />
        Filtres :
      </span>

      {filters.map((f) => (
        <span
          key={f.key}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-foreground"
        >
          <span className="text-muted-foreground">{f.label} :</span>
          {f.value}
          <button
            type="button"
            onClick={() => onRemove(f.key)}
            className="ml-0.5 flex size-3.5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            aria-label={`Retirer le filtre ${f.label}`}
          >
            <X className="size-2.5" />
          </button>
        </span>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Réinitialiser
      </Button>
    </div>
  )
}

export { FilterChips, type FilterChip, type FilterChipsProps }
