import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  accent: "ok" | "warn" | "info" | "gray" | "purple"
  changeLabel?: React.ReactNode
  progressPct?: number
  href?: string
}

const ACCENT_BORDER: Record<KpiCardProps["accent"], string> = {
  ok:     "border-t-status-ok",
  warn:   "border-t-status-warn",
  info:   "border-t-status-info",
  gray:   "border-t-status-gray",
  purple: "border-t-status-purple",
}

const ACCENT_ICON_BG: Record<KpiCardProps["accent"], string> = {
  ok:     "bg-status-ok-bg text-status-ok",
  warn:   "bg-status-warn-bg text-status-warn",
  info:   "bg-status-info-bg text-status-info",
  gray:   "bg-muted text-muted-foreground",
  purple: "bg-status-purple-bg text-status-purple",
}

const ACCENT_PROGRESS: Record<KpiCardProps["accent"], string> = {
  ok:     "bg-status-ok",
  warn:   "bg-status-warn",
  info:   "bg-status-info",
  gray:   "bg-muted-foreground",
  purple: "bg-status-purple",
}

function KpiCard({ label, value, icon, accent, changeLabel, progressPct, href }: KpiCardProps) {
  const content = (
    <div
      className={cn(
        "h-full flex flex-col rounded-card border border-t-[3px] border-border bg-card p-4 transition-shadow hover:shadow-medium",
        ACCENT_BORDER[accent],
        href && "cursor-pointer",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-legend text-muted-foreground leading-snug">{label}</p>
          <p className="text-mono text-title font-semibold tabular-nums text-foreground mt-1">
            {value}
          </p>
        </div>
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px]", ACCENT_ICON_BG[accent])}>
          {icon}
        </div>
      </div>

      <div className="mt-auto pt-2.5">
        {progressPct != null && (
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", ACCENT_PROGRESS[accent])}
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>
        )}
        {changeLabel && (
          <p className={cn("text-legend text-muted-foreground", progressPct != null && "mt-1.5")}>
            {changeLabel}
          </p>
        )}
      </div>
    </div>
  )

  return href ? <Link href={href} className="block h-full">{content}</Link> : content
}

export { KpiCard, type KpiCardProps }
