import { Badge } from "@/components/ui/badge"
import { SIZE_LABELS, LEGAL_LABELS } from "@/lib/status"

interface CompanyTagsProps {
  size: string
  legalStatus: string
  sectorName?: string | null
}

export function CompanyTags({ size, legalStatus, sectorName }: CompanyTagsProps) {
  const tags = [
    SIZE_LABELS[size] ?? size,
    LEGAL_LABELS[legalStatus] ?? legalStatus,
    sectorName ?? null,
  ].filter((t): t is string => Boolean(t))

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1.5">
          <span className="size-1.5 rounded-full bg-muted-foreground" aria-hidden="true" />
          {tag}
        </Badge>
      ))}
    </div>
  )
}
