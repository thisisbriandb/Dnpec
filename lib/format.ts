import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

const GNF_FORMATTER = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
  useGrouping: true,
})

const PERCENT_FORMATTER = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

export function formatGNF(n: number | null | undefined): string {
  if (n == null) return "—"
  return GNF_FORMATTER.format(n) + " GNF"
}

export function formatPercent(n: number | null | undefined): string {
  if (n == null) return "—"
  return PERCENT_FORMATTER.format(n) + " %"
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return format(new Date(date), "d MMM yyyy", { locale: fr })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return format(new Date(date), "d MMM yyyy, HH:mm", { locale: fr })
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return formatDistanceToNow(new Date(date), { locale: fr, addSuffix: true })
}

export function formatCompact(n: number | null | undefined): string {
  if (n == null) return "—"
  if (Math.abs(n) >= 1_000_000_000) {
    return (n / 1_000_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " Md"
  }
  if (Math.abs(n) >= 1_000_000) {
    return (n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " M"
  }
  if (Math.abs(n) >= 1_000) {
    return (n / 1_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " k"
  }
  return GNF_FORMATTER.format(n)
}

export function formatNIF(nif: string | null | undefined): string {
  if (!nif) return "—"
  return nif.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")
}

export function formatDelta(n: number | null | undefined): string {
  if (n == null) return "—"
  const sign = n > 0 ? "+" : ""
  return sign + PERCENT_FORMATTER.format(n) + " %"
}
