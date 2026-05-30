import * as React from "react"
import { cn } from "@/lib/utils"
import {
  ACCOUNT_STATUS,
  CAMPAIGN_STATUS,
  SUBMISSION_STATUS,
  TARGET_STATUS,
  FORM_VERSION_STATUS,
  JOB_STATUS,
  VARIANT_STYLES,
  type StatusVariant,
  type AccountStatus,
  type CampaignStatus,
  type SubmissionStatus,
  type TargetStatus,
  type FormVersionStatus,
  type JobStatus,
} from "@/lib/status"

type AnyStatus =
  | AccountStatus
  | CampaignStatus
  | SubmissionStatus
  | TargetStatus
  | FormVersionStatus
  | JobStatus

const ALL_STATUS_MAPS = [
  ACCOUNT_STATUS,
  CAMPAIGN_STATUS,
  SUBMISSION_STATUS,
  TARGET_STATUS,
  FORM_VERSION_STATUS,
  JOB_STATUS,
] as const

function resolveAny(status: string): { variant: StatusVariant; label: string } {
  for (const map of ALL_STATUS_MAPS) {
    const entry = (map as Record<string, { variant: StatusVariant; label: string }>)[status]
    if (entry) return entry
  }
  return { variant: "gray", label: status }
}

interface StatusBadgeProps {
  status: AnyStatus | string
  size?: "sm" | "md"
  showDot?: boolean
  className?: string
}

function StatusBadge({
  status,
  size = "md",
  showDot = true,
  className,
}: StatusBadgeProps) {
  const config = resolveAny(status)
  const styles = VARIANT_STYLES[config.variant]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        styles.bg,
        styles.text,
        styles.border,
        size === "sm" && "px-1.5 py-0.5 text-[10px] leading-4",
        size === "md" && "px-2 py-0.5 text-xs leading-5",
        className
      )}
    >
      {showDot && (
        <span
          className={cn("size-1.5 rounded-full flex-shrink-0", styles.dot)}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  )
}

export { StatusBadge, type StatusBadgeProps, type AnyStatus }
