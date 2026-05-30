import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  page: number
  pageCount: number
  total?: number
  pageSize?: number
  onPageChange: (page: number) => void
  className?: string
}

function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = getPageRange(page, pageCount)

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-1",
        className
      )}
    >
      {/* Count info */}
      <p className="text-xs text-muted-foreground shrink-0">
        {total != null && pageSize != null ? (
          <>
            {Math.min((page - 1) * pageSize + 1, total)}–
            {Math.min(page * pageSize, total)} sur{" "}
            <span className="font-medium text-foreground">
              {total.toLocaleString("fr-FR")}
            </span>
          </>
        ) : (
          <>
            Page{" "}
            <span className="font-medium text-foreground">{page}</span>{" "}
            sur{" "}
            <span className="font-medium text-foreground">{pageCount}</span>
          </>
        )}
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Page précédente"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="flex size-8 items-center justify-center text-xs text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="icon"
              onClick={() => onPageChange(p as number)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className="size-8 text-xs"
            >
              {p}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Page suivante"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function getPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "…", total]
  }
  if (current >= total - 3) {
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total]
  }
  return [1, "…", current - 1, current, current + 1, "…", total]
}

export { Pagination, type PaginationProps }
